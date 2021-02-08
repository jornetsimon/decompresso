import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PushNotificationsService } from '@services/push-notifications.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { debounceTime, switchMap, take } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UserService } from '@services/user.service';
import { undefinedFallback } from '@utilities/undefined-fallback';

@UntilDestroy()
@Component({
	selector: 'mas-notifications-management',
	templateUrl: './notifications-management.component.html',
	styleUrls: ['./notifications-management.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsManagementComponent {
	form = new FormGroup({});
	constructor(
		private pushNotificationsService: PushNotificationsService,
		private message: NzMessageService,
		private userService: UserService
	) {
		this.userService.user$.pipe(take(2)).subscribe({
			next: (user) => {
				this.form.addControl(
					'new_messages',
					new FormControl(
						undefinedFallback(user.notifications_settings?.new_messages, true)
					)
				);
				this.form.addControl(
					'new_members',
					new FormControl(
						undefinedFallback(user.notifications_settings?.new_members, true)
					)
				);
			},
			complete: () => {
				this.form.valueChanges
					.pipe(
						untilDestroyed(this),
						debounceTime(1000),
						switchMap((settings) =>
							this.pushNotificationsService.setUserSettings(settings)
						)
					)
					.subscribe({
						next: () => {
							this.message.success('Préférences de notifications sauvegardées');
						},
						error: (error) => {
							console.error(error);
							this.message.error(
								`Vos préférences de notifications n'ont pas pu être sauvegardées `
							);
						},
					});
			},
		});
	}
}
