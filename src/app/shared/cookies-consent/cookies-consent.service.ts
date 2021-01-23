import { Injectable } from '@angular/core';
import { merge, Observable, Subject } from 'rxjs';
import { map, shareReplay, takeWhile } from 'rxjs/operators';
import { StorageMap } from '@ngx-pwa/local-storage';
import { AngularFireAnalytics } from '@angular/fire/analytics';
import { Title } from '@angular/platform-browser';
import { AnalyticsService } from '@analytics/analytics.service';
import { environment } from '../../../environments/environment';

@Injectable({
	providedIn: 'root',
})
export class CookiesConsentService {
	private readonly storageKey = 'cookies-consent';
	private consentSubject = new Subject<boolean>();
	private storedConsent$ = this.storage.watch(this.storageKey).pipe(map((val) => val === 'true'));
	accepted$: Observable<boolean> = merge(
		this.storedConsent$,
		this.consentSubject.asObservable()
	).pipe(
		takeWhile((accepted) => !accepted, true),
		shareReplay(1)
	);
	constructor(
		private storage: StorageMap,
		private angularFireAnalytics: AngularFireAnalytics,
		private analyticsService: AnalyticsService,
		private title: Title
	) {}

	acceptCookies() {
		this.consentSubject.next(true);
		localStorage.setItem(this.storageKey, 'true');
		this.storage.set(this.storageKey, 'true').subscribe();
		this.angularFireAnalytics.setAnalyticsCollectionEnabled(environment.production).then(() => {
			this.analyticsService.logEvent('accepted_cookies');
			this.angularFireAnalytics.logEvent('screen_view', {
				page_path: '/help',
				page_title: this.title.getTitle(),
			});
		});
	}
}
