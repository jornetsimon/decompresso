import { Injectable } from '@angular/core';
import { SwPush, SwUpdate } from '@angular/service-worker';
import { FirebaseApp } from '@angular/fire';
import { AngularFireMessaging } from '@angular/fire/messaging';
import { from, Observable, of } from 'rxjs';
import {
	catchError,
	map,
	mapTo,
	shareReplay,
	startWith,
	switchMap,
	takeWhile,
	tap,
} from 'rxjs/operators';
import { UntilDestroy } from '@ngneat/until-destroy';
import { environment } from '../../../environments/environment';
import { UserNotificationSettings } from '@model/user-notification-settings';
import { AngularFireFunctions } from '@angular/fire/functions';

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
		shareReplay(1),
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
						map((token) => !!token),
						tap((enabled) => {
							if (enabled) {
								console.log('%c🔔 Notifications activées', 'color: green');
							}
						}),
						catchError((err) => of(false))
				  )
				: of(false)
		),
		map((token) => !!token && Notification.permission === 'granted'),
		takeWhile((enabled) => !enabled, true),
		shareReplay()
	);

	constructor(
		private swUpdate: SwUpdate,
		private swPush: SwPush,
		private firebase: FirebaseApp,
		private fireMessaging: AngularFireMessaging,
		private fns: AngularFireFunctions
	) {}

	setup(): Observable<boolean> {
		return from(this.requestPermission()).pipe(
			switchMap((permission) => {
				if (permission === 'granted') {
					return this.setup$.pipe(
						switchMap((token) => {
							if (!token) {
								throw new Error('could_not_retrieve_token');
							}
							return this.setUserSettings({
								new_members: true,
								new_messages: true,
								token,
							}).pipe(mapTo(true));
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

	setUserSettings(settings: UserNotificationSettings) {
		const callable = this.fns.httpsCallable('setUserNotificationSettings');
		return callable(settings);
	}
}
