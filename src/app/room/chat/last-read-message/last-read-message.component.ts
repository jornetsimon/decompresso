import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'mas-last-read-message',
	templateUrl: './last-read-message.component.html',
	styleUrls: ['./last-read-message.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LastReadMessageComponent {}
