import { fromEvent, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, scan, takeWhile } from 'rxjs/operators';
import { ElementRef } from '@angular/core';

/**
 * Tracks the reading state of an HTML element based on the scrolling position
 */
export class ElementReadingTracker {
	/**
	 * The HTML element to track
	 */
	protected readonly element: ElementRef<HTMLElement>;
	/**
	 * At which percentage of its height the element should be considered read
	 */
	thresholdPercentage: number;
	/**
	 * Number of pixels from top to track from
	 *
	 * Will default to window.innerHeight
	 */
	watchFromTop?: number;

	protected scroll$ = fromEvent(window, 'scroll').pipe(debounceTime(500));
	readingPercentage$: Observable<number> = this.scroll$.pipe(
		map(() => this.readingPercentage()),
		scan((prev, curr) => Math.max(prev, curr), 0),
		distinctUntilChanged(),
		takeWhile((pct) => pct < 100, true)
	);
	isRead$: Observable<boolean> = this.readingPercentage$.pipe(
		map((pct) => pct >= this.thresholdPercentage),
		distinctUntilChanged(),
		takeWhile((isRead) => !isRead, true)
	);

	constructor(
		element: ElementRef<HTMLElement>,
		thresholdPercentage = 100,
		watchFromTop?: number
	) {
		this.element = element;
		this.thresholdPercentage = Math.min(Math.max(thresholdPercentage, 0), 100);
		this.watchFromTop = watchFromTop;
	}

	protected height(): number {
		return this.element.nativeElement.scrollHeight;
	}
	protected top(): number {
		return this.element.nativeElement.offsetTop;
	}

	readingPercentage(): number {
		const exact =
			((window.scrollY + (this.watchFromTop ?? window.innerHeight) - this.top()) * 100) /
			this.height();
		const rounded = Math.round(exact);
		return Math.min(Math.max(rounded, 0), 100);
	}
	isRead(): boolean {
		return this.readingPercentage() >= this.thresholdPercentage;
	}
}
