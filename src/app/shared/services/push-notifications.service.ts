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

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class PushNotificationsService {
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
	newTokenDetected$: Observable<string> = this.fireMessaging.tokenChanges.pipe(
		withLatestFrom(
			this.userService.user$.pipe(map((user) => user.notifications_settings?.tokens))
		),
		// tslint:disable-next-line:readonly-array
		filter(([currentToken, storedTokens]: [string | null, Array<string> | undefined]) => {
			if (!currentToken) {
				return false;
			}
			if (!storedTokens?.length) {
				return true;
			}
			return !storedTokens.includes(currentToken);
		}),
		map(([currentToken]) => currentToken as string)
	);

	constructor(
		private swUpdate: SwUpdate,
		private swPush: SwPush,
		private firebase: FirebaseApp,
		private fireMessaging: AngularFireMessaging,
		private fns: AngularFireFunctions,
		private userService: UserService
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
		settings: Partial<Omit<UserNotificationSettings, 'tokens'> & { token: string }>
	) {
		const callable = this.fns.httpsCallable('setUserNotificationSettings');
		return callable(settings);
	}
}
