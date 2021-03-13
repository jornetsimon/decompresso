import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { LayoutService } from './layout.service';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { RoomService } from '@services/room.service';
import { UserService } from '@services/user.service';
import { CookiesConsentService } from '../shared/cookies-consent/cookies-consent.service';

@Component({
	selector: 'mas-layout',
	templateUrl: './layout.component.html',
	styleUrls: ['./layout.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
	/**
	 * The pattern to match routes for which the compact mode should be used
	 */
	compactModeRouteMatchingPattern = /^\/room\/.+/;
	/**
	 * Defines if the compact layout should be used based on the current route
	 */
	enableCompactMode$: Observable<boolean>;
	domain$ = this.roomService.room$.pipe(map((room) => room.domain));
	domainFontSize$ = this.domain$.pipe(
		map((domain) => {
			const length = domain.length;
			const magicRatio = 25;
			// Sizes in px
			const maxSize = 22;
			const minSize = 9;
			const estimate = maxSize * 1.5 - (length * maxSize) / magicRatio;
			if (estimate < minSize) {
				return minSize;
			}
			if (estimate > maxSize) {
				return maxSize;
			}
			return Math.round(estimate);
		})
	);
	isOffline$ = this.userService.connectionStatus$.pipe(map((status) => status === 'offline'));
	isKnown = window.localStorage.getItem('is-known') === 'true';
	routeMatchesRoom$ = this.router.events.pipe(
		filter((event) => event instanceof NavigationEnd),
		map((event: NavigationEnd) => event.url),
		startWith(this.router.url),
		map((url) => url.startsWith('/room/'))
	);
	constructor(
		public authService: AuthService,
		public layoutService: LayoutService,
		public router: Router,
		public roomService: RoomService,
		private userService: UserService,
		public cookiesConsentService: CookiesConsentService
	) {
		this.enableCompactMode$ = this.router.events.pipe(
			filter((event) => event instanceof NavigationEnd),
			map(
				(event: NavigationStart) => !!event.url.match(this.compactModeRouteMatchingPattern)
			),
			startWith(!!this.router.url.match(this.compactModeRouteMatchingPattern))
		);
	}

	toggleDrawer() {
		this.layoutService.showUserDrawer = !this.layoutService.showUserDrawer;
	}
	logout() {
		this.authService.deleteAuthUser().subscribe({
			next: () => {
				this.router.navigateByUrl('/');
			},
		});
	}
}
