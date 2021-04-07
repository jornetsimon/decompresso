import { Injectable } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class AdminService {
	isAdmin$ = this.authService.waitForAuthChecked$.pipe(
		switchMap(() => this.authService.authCredential$),
		switchMap((cred) => {
			if (!cred) {
				return of(null);
			}
			return cred.getIdTokenResult();
		}),
		map((idTokenResult) => idTokenResult?.claims?.admin === true)
	);

	constructor(private authService: AuthService) {}
}
