import { Directive, TemplateRef, ViewContainerRef } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NgIf } from '@angular/common';
import { AdminService } from '@services/admin.service';

/**
 * Acts as an *ngIf for admin privileges
 */
@UntilDestroy()
@Directive({
	selector: '[ifAdmin]',
})
export class IfAdminDirective {
	private readonly ngIfDirective: NgIf;

	constructor(
		private adminService: AdminService,
		private templateRef: TemplateRef<any>,
		private viewContainer: ViewContainerRef
	) {
		if (!this.ngIfDirective) {
			this.ngIfDirective = new NgIf(this.viewContainer, this.templateRef);
		}

		this.adminService.isAdmin$.pipe(untilDestroyed(this)).subscribe((isAdmin) => {
			this.ngIfDirective.ngIf = isAdmin;
		});
	}
}
