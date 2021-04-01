import { Injectable, TemplateRef } from '@angular/core';
import { GaCategoryEnum } from '@analytics/ga-category.enum';
import { PushNotificationsService } from '@services/push-notifications.service';
import { PwaService } from '@services/pwa/pwa.service';
import { AnalyticsService } from '@analytics/analytics.service';
import { BehaviorSubject, from } from 'rxjs';
import { shareReplay, takeWhile, tap } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AngularFireRemoteConfig } from '@angular/fire/remote-config';
import { DeviceDetectorService } from 'ngx-device-detector';

@Injectable({
	providedIn: 'root',
})
export class EnhancementService {
	private userInstalledPwa = new BehaviorSubject(false);
	private userEnabledNotifications = new BehaviorSubject(false);
	enableNotifications$ = this.remoteConfig.booleans.notifications.pipe(
		tap((notifications) => {
			if (notifications) {
				console.log('Enabling through remote config : notifications');
			}
		}),
		shareReplay(1)
	);
	userInstalledPwa$ = this.userInstalledPwa
		.asObservable()
		.pipe(takeWhile((installed) => !installed, true));
	userEnabledNotifications$ = this.userEnabledNotifications
		.asObservable()
		.pipe(takeWhile((installed) => !installed, true));
	constructor(
		public pushNotificationsService: PushNotificationsService,
		private pwaService: PwaService,
		private analyticsService: AnalyticsService,
		private message: NzMessageService,
		private remoteConfig: AngularFireRemoteConfig,
		private deviceDetectorService: DeviceDetectorService
	) {}

	/**
	 * Show the PWA install prompt.
	 *
	 * @description The user can then decide to install it or not.
	 */
	installPwa() {
		this.pwaService.showPwaInstallPrompt();
		return from(this.pwaService.deferredPrompt.userChoice).pipe(
			tap((choiceResult) => {
				if (choiceResult.outcome === 'accepted') {
					this.userInstalledPwa.next(true);
					this.analyticsService.logEvent('install_pwa_button', GaCategoryEnum.ENGAGEMENT);
				}
			}),
			shareReplay(1)
		);
	}

	/**
	 * Ask for permission to show notifications then enable FCM
	 * @param disabledNotificationsWarningTpl A template reference to describe how to allow notification in cas they are denied
	 */
	setupNotifications(disabledNotificationsWarningTpl?: TemplateRef<void>) {
		this.pushNotificationsService.setup().subscribe({
			next: () => {
				this.message.success('Notifications activées');
				this.analyticsService.logEvent(
					'enable_notifications',
					GaCategoryEnum.ENGAGEMENT,
					this.deviceDetectorService.deviceType
				);
				this.userEnabledNotifications.next(true);
			},
			error: (error: Error) => {
				console.error(error);
				if (
					error.message === 'notifications_denied_in_browser' &&
					disabledNotificationsWarningTpl
				) {
					this.message.warning(disabledNotificationsWarningTpl, {
						nzDuration: 15000,
						nzPauseOnHover: true,
					});
				} else {
					this.message.error(`Impossible d'activer les notification pour l'instant`);
				}
			},
		});
	}
}
