import { Injectable } from '@angular/core';
import { CanLoad, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from '@services/auth.service';

@Injectable({
	providedIn: 'root',
})
export class AdminGuard implements CanLoad {
	constructor(private authService: AuthService, private router: Router) {}
	canLoad(
		route: Route,
		// tslint:disable-next-line:readonly-array
		segments: UrlSegment[]
	): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
		return this.authService.waitForAuthChecked$.pipe(
			switchMap(() => this.authService.authCredential$),
			map((authUser) => {
				const domain = authUser?.email?.split('@')[1];
				if (
					(authUser?.emailVerified && domain === 'job-tunnel.com') ||
					domain === 'decompresso.fr'
				) {
					return true;
				}
				return this.router.parseUrl('/');
			})
		);
	}
}
