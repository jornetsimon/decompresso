import { Injectable } from '@angular/core';
import { merge, Observable, Subject } from 'rxjs';
import { map, shareReplay, takeWhile } from 'rxjs/operators';
import { StorageMap } from '@ngx-pwa/local-storage';
import { AngularFireAnalytics } from '@angular/fire/analytics';

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
	constructor(private storage: StorageMap, private analytics: AngularFireAnalytics) {}

	acceptCookies() {
		this.consentSubject.next(true);
		localStorage.setItem(this.storageKey, 'true');
		this.storage.set(this.storageKey, 'true').subscribe();
		this.analytics.setAnalyticsCollectionEnabled(true);
	}
}
