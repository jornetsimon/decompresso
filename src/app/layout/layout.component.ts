import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { LayoutService } from './layout.service';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
	selector: 'mas-layout',
	templateUrl: './layout.component.html',
	styleUrls: ['./layout.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
	now = Date.now();
	/**
	 * The pattern to match routes for which the compact mode should be used
	 */
	compactModeRouteMatchingPattern = /^\/room\/.+/;
	/**
	 * Defines if the compact layout should be used based on the current route
	 */
	enableCompactMode$: Observable<boolean>;
	constructor(
		public authService: AuthService,
		public layoutService: LayoutService,
		public router: Router
	) {
		this.enableCompactMode$ = this.router.events.pipe(
			filter((event) => event instanceof NavigationEnd),
			map(
				(event: NavigationStart) => !!event.url.match(this.compactModeRouteMatchingPattern)
			),
			startWith(!!this.router.url.match(this.compactModeRouteMatchingPattern))
		);
	}
}
