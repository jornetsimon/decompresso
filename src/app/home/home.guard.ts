import { Injectable } from '@angular/core';
import {
	ActivatedRouteSnapshot,
	CanActivate,
	Router,
	RouterStateSnapshot,
	UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '@services/auth.service';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class HomeGuard implements CanActivate {
	constructor(private authService: AuthService, private router: Router) {}
	canActivate(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
		return this.authService.waitForAuthChecked$.pipe(
			switchMap(() => this.authService.isAuthenticated$),
			switchMap((isAuthenticated) => {
				if (!isAuthenticated) {
					return of(true);
				}
				return this.authService.user$.pipe(
					map((user) => (user ? this.router.parseUrl(`/room/${user.domain}`) : true))
				);
			})
		);
	}
}
