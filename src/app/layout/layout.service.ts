import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent } from 'rxjs';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import {
	debounceTime,
	distinctUntilChanged,
	filter,
	map,
	pairwise,
	shareReplay,
	startWith,
} from 'rxjs/operators';
import { GLOBAL_CONFIG } from '../global-config';
import { DeviceDetectorService } from 'ngx-device-detector';

@Injectable({
	providedIn: 'root',
})
export class LayoutService {
	showUserDrawer: boolean;
	inputFocusSubject = new BehaviorSubject<boolean>(false);
	chatLayout$ = this.router.events.pipe(
		filter((event) => event instanceof NavigationEnd),
		map((event: NavigationStart) => {
			if (this.deviceService.isDesktop()) {
				return false;
			}
			return !!event.url.match(/^\/room\/.+$/);
		}),
		startWith(this.deviceService.isDesktop() ? false : !!this.router.url.match(/^\/room\/.+$/)),
		distinctUntilChanged(),
		shareReplay()
	);

	/**
	 * Detects a virtual keyboard toggling
	 */
	virtualKeyboardToggleDetected$ = fromEvent(window.visualViewport, 'resize').pipe(
		filter(() => this.deviceService.isMobile() || this.deviceService.isDesktop()),
		debounceTime(100),
		map((event) => (event.target as VisualViewport).height),
		startWith(window.visualViewport.height),
		pairwise(),
		filter(([prev, curr]) => {
			const max = prev < curr ? curr : prev;
			const min = prev < curr ? prev : curr;
			const diffPct = ((max - min) * 100) / max;
			return diffPct >= GLOBAL_CONFIG.virtualKeyboardDetectionPct;
		}),
		map(([prev, curr]): 'opened' | 'closed' => (prev < curr ? 'closed' : 'opened')),
		startWith('closed')
	);
	constructor(private router: Router, private deviceService: DeviceDetectorService) {}
}
