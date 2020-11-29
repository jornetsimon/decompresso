import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UserSettings } from '@model/user-personal-data';
import { UserService } from '@services/user.service';
import { distinctUntilChanged, filter, map, skip, switchMap } from 'rxjs/operators';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { distinctObject } from '@utilities/distinct-object-operator';
import { NotificationsService } from '@services/notifications.service';
import { NzMessageService } from 'ng-zorro-antd/message';

@UntilDestroy()
@Component({
	selector: 'mas-settings',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
	settings$: Observable<UserSettings> = this.userService.userPersonalData$.pipe(
		map((data) => data?.settings || {}),
		distinctObject
	);
	form = this.fb.group({
		localNotifications: this.fb.control(false),
	});
	constructor(
		private fb: FormBuilder,
		private userService: UserService,
		private notificationsService: NotificationsService,
		private message: NzMessageService
	) {}

	ngOnInit(): void {
		this.settings$.subscribe((settings) => {
			this.form.patchValue(settings);
		});

		this.form.valueChanges
			.pipe(
				skip(1),
				switchMap((formValues: UserSettings) =>
					this.userService.updatePersonalData({ settings: formValues })
				),
				untilDestroyed(this)
			)
			.subscribe();

		this.form
			.get('localNotifications')
			?.valueChanges.pipe(
				distinctUntilChanged(),
				filter((enabled) => !!enabled),
				untilDestroyed(this),
				switchMap(() => this.notificationsService.requestPermission())
			)
			.subscribe({
				next: (justActivated) => {
					if (justActivated) {
						this.message.success('Notifications activées');
					}
				},
				error: (err) => {
					this.message.error(
						'Pour activer les notifications, merci de les autoriser dans votre navigateur'
					);
				},
			});
	}
}
