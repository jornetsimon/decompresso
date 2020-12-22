import { Injectable } from '@angular/core';
import { CanLoad, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
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
			switchMap((cred) => {
				if (!cred) {
					return of(null);
				}
				return cred.getIdTokenResult();
			}),
			map((idTokenResult) => {
				if (idTokenResult?.claims.admin === true) {
					return true;
				}
				return this.router.parseUrl('/');
			})
		);
	}
}
