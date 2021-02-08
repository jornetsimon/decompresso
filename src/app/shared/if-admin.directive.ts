import { Directive, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NgIf } from '@angular/common';

/**
 * Acts as an *ngIf for admin privileges
 */
@UntilDestroy()
@Directive({
	selector: '[ifAdmin]',
})
export class IfAdminDirective {
	private readonly ngIfDirective: NgIf;
	private isAdmin$ = this.authService.waitForAuthChecked$.pipe(
		switchMap(() => this.authService.authCredential$),
		switchMap((cred) => {
			if (!cred) {
				return of(null);
			}
			return cred.getIdTokenResult();
		}),
		map((idTokenResult) => idTokenResult?.claims?.admin === true)
	);

	constructor(
		private authService: AuthService,
		private templateRef: TemplateRef<any>,
		private viewContainer: ViewContainerRef
	) {
		if (!this.ngIfDirective) {
			this.ngIfDirective = new NgIf(this.viewContainer, this.templateRef);
		}

		this.isAdmin$.pipe(untilDestroyed(this)).subscribe((isAdmin) => {
			this.ngIfDirective.ngIf = isAdmin;
		});
	}
}
