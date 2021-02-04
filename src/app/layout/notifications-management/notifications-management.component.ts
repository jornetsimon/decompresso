import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PushNotificationsService } from '@services/push-notifications.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { first, switchMap, tap } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UserService } from '@services/user.service';

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
		this.userService.user$.pipe(first()).subscribe((user) => {
			this.form.addControl(
				'newMessages',
				new FormControl(user.notifications_settings.new_messages || false)
			);
			this.form.addControl(
				'newMembers',
				new FormControl(user.notifications_settings.new_members || false)
			);
		});
		this.form.valueChanges
			.pipe(
				untilDestroyed(this),
				switchMap((settings) => this.pushNotificationsService.setUserSettings(settings)),
				tap((x) => console.log(x))
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
	}
}
