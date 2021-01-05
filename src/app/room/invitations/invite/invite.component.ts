import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

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
	emailFc = new FormControl(undefined, [Validators.required, Validators.pattern(this.pattern)]);
	form = new FormGroup({
		email: this.emailFc,
	});
	constructor() {}

	sendInvite() {
		if (this.sent) {
			return;
		}
		this.emailFc.disable();
		this.inviteSent.next(this.emailFc.value);
		this.sent = true;
	}
}
