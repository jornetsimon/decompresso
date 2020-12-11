import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Message } from '@model/message';
import { User } from '@model/user';

@Component({
	selector: 'mas-report',
	templateUrl: './report.component.html',
	styleUrls: ['./report.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportComponent {
	@Input() message: Message;
	@Input() authorUser: User;
	constructor() {}
}
