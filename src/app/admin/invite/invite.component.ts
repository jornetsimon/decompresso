import { Component, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { InvitationsService } from '../../room/invitations/invitations.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AnalyticsService } from '@analytics/analytics.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
	emailPattern,
	PrivateDomainEmailService,
} from '../../shared/private-domain-email/private-domain-email.service';
import { GaCategoryEnum } from '@analytics/ga-category.enum';
import { finalize } from 'rxjs/operators';

@UntilDestroy()
@Component({
	selector: 'mas-invite',
	templateUrl: './invite.component.html',
	styleUrls: ['./invite.component.scss'],
})
export class InviteComponent {
	domain: string;
	inviteSent = new EventEmitter<string>();
	sent = false;
	loading = false;
	private readonly pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))$/;
	emailFc = new FormControl(undefined, [
		Validators.required,
		PrivateDomainEmailService.emailValidator,
		PrivateDomainEmailService.emailDomainIsPrivate,
	]);
	form = new FormGroup({
		email: this.emailFc,
	});
	constructor(
		private invitationsService: InvitationsService,
		private message: NzMessageService,
		private analyticsService: AnalyticsService
	) {
		this.emailFc.valueChanges.pipe(untilDestroyed(this)).subscribe((value: string) => {
			if (value.match(emailPattern) && value.split('@')[1] === this.domain) {
				// The value is a full email address from the domain
				// Lets cut it for the user
				this.emailFc.setValue(value.split('@')[0]);
			}
		});
	}

	sendInvite() {
		if (this.sent) {
			return;
		}
		this.loading = true;
		this.analyticsService.logEvent('invite', GaCategoryEnum.ENGAGEMENT);
		const email = this.emailFc.value;
		this.invitationsService
			.sendInvitation(email)
			.pipe(
				finalize(() => {
					this.loading = false;
				})
			)
			.subscribe(
				() => {
					this.emailFc.disable();
					this.inviteSent.next(email);
					this.sent = true;
				},
				(err) => {
					console.error(err);
					this.message.error(
						`L'invitation n'a pas pu être envoyée à ${email}. Merci de réessayer plus tard.`
					);
				}
			);
	}
}
