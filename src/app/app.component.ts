import { Component } from '@angular/core';
import { fromEvent } from 'rxjs';
import { PwaService } from '@services/pwa/pwa.service';
import { BeforeInstallPromptEvent } from '@services/pwa/before-install-prompt-event';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AnalyticsService } from '@analytics/analytics.service';
import { GaCategoryEnum } from '@analytics/ga-category.enum';
import { first, switchMapTo, take } from 'rxjs/operators';
import { SwUpdate } from '@angular/service-worker';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AdminService } from '@services/admin.service';

@UntilDestroy()
@Component({
	selector: 'mas-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent {
	constructor(
		private pwaService: PwaService,
		private analyticsService: AnalyticsService,
		private swUpdate: SwUpdate,
		private messageService: NzMessageService,
		private adminService: AdminService
	) {
		// First we get the viewport height and we multiple it by 1% to get a value for a vh unit
		const vh = window.innerHeight * 0.01;
		// Then we set the value in the --vh custom property to the root of the document
		document.documentElement.style.setProperty('--vh', `${vh}px`);

		fromEvent(window, 'beforeinstallprompt')
			.pipe(untilDestroyed(this))
			.subscribe((e: BeforeInstallPromptEvent) => {
				// Prevent the mini-infobar from appearing on mobile
				e.preventDefault();
				// Stash the event so it can be triggered later.
				this.pwaService.deferredPrompt = e;
			});

		fromEvent(window, 'appinstalled')
			.pipe(untilDestroyed(this))
			.subscribe(() => {
				this.analyticsService.logEvent('install_pwa', GaCategoryEnum.ENGAGEMENT);
			});

		/**
		 * When the SW detects an update, show a notification to admins
		 */
		this.swUpdate.available
			.pipe(switchMapTo(this.adminService.isAdmin$.pipe(first())), take(1))
			.subscribe((isAdmin) => {
				if (isAdmin) {
					this.messageService.info('Une mise à jour est disponible', {
						nzDuration: 5000,
					});
				}
			});
	}
}
