/* tslint:disable:readonly-array */
import { Injectable } from '@angular/core';
import { SwPush, SwUpdate } from '@angular/service-worker';
import { FirebaseApp } from '@angular/fire';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { from, Observable, of } from 'rxjs';
import {
	catchError,
	debounceTime,
	filter,
	map,
	mapTo,
	shareReplay,
	startWith,
	switchMap,
	takeWhile,
	tap,
	withLatestFrom,
} from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { environment } from '../../../environments/environment';
import { UserNotificationSettings } from '@model/user-notification-settings';
import { AngularFireFunctions } from '@angular/fire/functions';
import { UserService } from '@services/user.service';
import { DeviceDetectorService, DeviceType } from 'ngx-device-detector';

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class PushNotificationsService {
	private deviceType = this.deviceDetectorService.deviceType as DeviceType;
	serviceWorkerRegistration$: Observable<ServiceWorkerRegistration | undefined> = from(
		navigator.serviceWorker.getRegistration()
	);
	swSetup$ = this.serviceWorkerRegistration$.pipe(
		switchMap((serviceWorkerRegistration) => {
			if (serviceWorkerRegistration) {
				return from(this.fireMessaging.useServiceWorker(serviceWorkerRegistration)).pipe(
					mapTo(true)
				);
			} else {
				return of(false);
			}
		}),
		shareReplay(1)
	);
	setup$ = this.swSetup$.pipe(
		switchMap((serviceWorkerAssignment) => {
			if (!serviceWorkerAssignment) {
				throw new Error('no_service_worker_registered');
			}
			return this.fireMessaging.getToken;
		}),
		map((token): string => {
			if (!token) {
				throw new Error('failed_to_get_messaging_token');
			}
			return token;
		}),
		tap((token) => {
			if (!environment.production) {
				console.log('Cloud Messaging token enabled', token);
			}
		})
	);

	canUse$ = this.serviceWorkerRegistration$.pipe(
		map((registration) => !!registration?.active && Notification.permission !== 'denied'),
		startWith(false)
	);
	enabled$ = this.swSetup$.pipe(
		switchMap((serviceWorkerAssignment) =>
			serviceWorkerAssignment
				? this.fireMessaging.tokenChanges.pipe(
						tap((token) => {
							if (token) {
								console.log('%c🔔 Notifications activées', 'color: green', token);
							}
						}),
						map((token) => !!token),
						catchError((err) => of(false))
				  )
				: of(false)
		),
		map((token) => !!token && Notification.permission === 'granted'),
		takeWhile((enabled) => !enabled, true),
		shareReplay()
	);
	newTokenDetected$: Observable<string> = this.serviceWorkerRegistration$.pipe(
		filter((serviceWorkerRegistration) => !!serviceWorkerRegistration),
		switchMap(() => this.fireMessaging.tokenChanges),
		withLatestFrom(
			this.userService.user$.pipe(map((user) => user.notifications_settings?.tokens))
		),
		filter(
			([currentToken, storedTokens]: [
				string | null,
				Record<DeviceType, string> | undefined
			]) => {
				if (!currentToken) {
					return false;
				}
				if (!storedTokens || Object.keys(storedTokens).length === 0) {
					return true;
				}
				return !(storedTokens[this.deviceType] === currentToken);
			}
		),
		map(([currentToken]) => currentToken as string)
	);

	constructor(
		private swUpdate: SwUpdate,
		private swPush: SwPush,
		private firebase: FirebaseApp,
		private fireMessaging: AngularFireMessaging,
		private fns: AngularFireFunctions,
		private userService: UserService,
		private deviceDetectorService: DeviceDetectorService
	) {
		this.newTokenDetected$
			.pipe(
				debounceTime(1000),
				untilDestroyed(this),
				tap({
					next: (newToken) => {
						console.log('Updating token in db', newToken);
					},
				}),
				switchMap((newToken) =>
					this.setUserSettings({
						token: newToken,
						device_type: this.deviceType,
					})
				)
			)
			.subscribe();
	}

	setup(): Observable<boolean> {
		return from(this.requestPermission()).pipe(
			switchMap((permission) => {
				if (permission === 'granted') {
					return this.setup$.pipe(
						map((token) => {
							if (!token) {
								throw new Error('could_not_retrieve_token');
							}
							return true;
						})
					);
				} else {
					throw new Error('notifications_denied_in_browser');
				}
			})
		);
	}

	async requestPermission() {
		await Notification.requestPermission();
		return Notification.permission;
	}

	setUserSettings(
		settings: Partial<
			Omit<UserNotificationSettings, 'tokens'> & { token: string; device_type: DeviceType }
		>
	) {
		const callable = this.fns.httpsCallable('setUserNotificationSettings');
		return callable(settings);
	}
}
