import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PushNotificationsService } from '@services/push-notifications.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UserService } from '@services/user.service';
import { debounceTime, switchMap, take, tap } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { undefinedFallback } from '@utilities/undefined-fallback';
import { UserNewsletterSettings } from '@model/user-newsletter-settings';
import { AngularFireFunctions } from '@angular/fire/functions';
import { Router } from '@angular/router';

@UntilDestroy()
@Component({
	selector: 'mas-newsletter-management',
	templateUrl: './newsletter-management.component.html',
	styleUrls: ['./newsletter-management.component.scss'],
})
export class NewsletterManagementComponent {
	@Output() closing = new EventEmitter<void>();
	form = new FormGroup({
		important: new FormControl(true),
	});
	constructor(
		private pushNotificationsService: PushNotificationsService,
		private message: NzMessageService,
		private userService: UserService,
		private fns: AngularFireFunctions,
		private router: Router
	) {
		this.userService.user$.pipe(take(2)).subscribe({
			next: (user) => {
				this.form.addControl(
					'new_features',
					new FormControl(undefinedFallback(user.newsletter_settings?.new_features, true))
				);
				this.form.addControl(
					'others',
					new FormControl(undefinedFallback(user.newsletter_settings?.others, true))
				);
			},
			complete: () => {
				this.form.valueChanges
					.pipe(
						untilDestroyed(this),
						debounceTime(1000),
						tap((x) => console.log(x)),
						switchMap((settings) => this.setSettings(settings))
					)
					.subscribe({
						next: () => {
							this.message.success('Préférences de newsletter sauvegardées');
						},
						error: (error) => {
							console.error(error);
							this.message.error(
								`Vos préférences de newsletter n'ont pas pu être sauvegardées `
							);
						},
					});
			},
		});
	}

	setSettings(settings: Partial<UserNewsletterSettings>) {
		const callable = this.fns.httpsCallable('setUserNewsletterSettings');
		return callable(settings);
	}

	goToPrivacy() {
		this.closing.emit();
		return this.router.navigate(['cgu'], { fragment: 'privacy' });
	}
}
