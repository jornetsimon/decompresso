import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { InvitationsService } from '../invitations.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { finalize } from 'rxjs/operators';

@Component({
	selector: 'mas-invite',
	templateUrl: './invite.component.html',
	styleUrls: ['./invite.component.scss'],
	changeDetection: ChangeDetectionStrategy.Default,
})
export class InviteComponent {
	@Input() placeholder?: string;
	@Input() domain: string;
	@Output() inviteSent = new EventEmitter<string>();
	private readonly pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))$/;
	sent = false;
	loading = false;
	emailFc = new FormControl(undefined, [Validators.required, Validators.pattern(this.pattern)]);
	form = new FormGroup({
		email: this.emailFc,
	});
	constructor(
		private invitationsService: InvitationsService,
		private message: NzMessageService
	) {}

	sendInvite() {
		if (this.sent) {
			return;
		}
		this.loading = true;
		const email = this.emailFc.value + '@' + this.domain;
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
