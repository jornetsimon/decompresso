import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Observable, timer } from 'rxjs';
import {
	distinctUntilChanged,
	filter,
	map,
	mapTo,
	switchMap,
	take,
	tap,
	throttleTime,
} from 'rxjs/operators';
import { GLOBAL_CONFIG } from '../../global-config';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

/**
 * Activity state detection
 */
@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class ActivityService {
	private isActiveSubject = new BehaviorSubject<boolean>(true);
	/**
	 * Whether the user is active or not
	 */
	isActive$ = this.isActiveSubject.asObservable();
	/**
	 * Time elapsed since inactivity
	 *
	 * Precision is conditioned by {@link checkInterval}
	 */
	timeLapsedSinceInactivity: number;

	/**
	 * Event types to monitor in order to detect activity
	 */
	private activityEvents: ReadonlyArray<readonly [any, string]> = [
		[document, 'click'],
		[document, 'wheel'],
		[document, 'scroll'],
		[document, 'mousemove'],
		[document, 'keyup'],
		[window, 'resize'],
		[window, 'scroll'],
		[window, 'mousemove'],
	];
	private eventStream$ = merge(...this.activityEvents.map((el) => fromEvent(el[0], el[1])));
	/**
	 * Uses the Page Visibility API
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
	 */
	visibility$ = fromEvent(document, 'visibilitychange').pipe(map(() => document.visibilityState));
	/**
	 * Emits when the page becomes visible
	 */
	private visible$ = this.visibility$.pipe(
		filter((visibility) => visibility === 'visible')
	) as Observable<'visible'>;

	private intervalCount = GLOBAL_CONFIG.chat.timeout.intervalCount;
	private checkInterval = GLOBAL_CONFIG.chat.timeout.checkInterval;

	constructor(private _ngZone: NgZone) {
		this._ngZone.runOutsideAngular(() =>
			merge(
				this.eventStream$.pipe(
					throttleTime(500),
					switchMap((ev) =>
						timer(0, this.checkInterval).pipe(take(this.intervalCount + 1))
					),
					tap((count) => {
						this.timeLapsedSinceInactivity = count * this.checkInterval;
					}),
					filter((elapsed: number) => {
						return elapsed === 0 || elapsed === this.intervalCount;
					}),
					map((elapsed) => elapsed === 0),
					distinctUntilChanged(),
					untilDestroyed(this)
				),
				this.visible$.pipe(mapTo(true))
			).subscribe((isActive) => this.isActiveSubject.next(isActive))
		);
	}
}
