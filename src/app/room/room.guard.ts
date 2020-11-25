import { Injectable } from '@angular/core';
import {
	ActivatedRouteSnapshot,
	CanActivate,
	Router,
	RouterStateSnapshot,
	UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { UserService } from '@services/user.service';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from '@services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable({
	providedIn: 'root',
})
export class RoomGuard implements CanActivate {
	constructor(
		private userService: UserService,
		private authService: AuthService,
		private router: Router,
		private message: NzMessageService
	) {}
	canActivate(
		route: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
		return this.authService.waitForAuthChecked$.pipe(
			switchMap(() => this.authService.authCredential$),
			switchMap((authUser) => {
				if (!authUser?.emailVerified) {
					return of(undefined);
				}
				return this.userService.user$;
			}),
			map((user) => {
				const roomDomain = route.params.domain;
				if (user?.domain === roomDomain) {
					return true;
				} else {
					this.message.error(`Vous n'avez pas accès à ce salon 🙅‍♂️`);
					return this.router.parseUrl('/');
				}
			})
		);
	}
}
