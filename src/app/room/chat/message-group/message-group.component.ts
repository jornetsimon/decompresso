import { ChangeDetectionStrategy, Component, Input, TrackByFunction } from '@angular/core';
import { MappedMessage, MessageFeedEntry } from '../model';

@Component({
	selector: 'mas-message-group',
	templateUrl: './message-group.component.html',
	styleUrls: ['./message-group.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageGroupComponent {
	@Input() group: MessageFeedEntry;

	trackByMessageFn: TrackByFunction<MappedMessage> = (index, item) => item.uid;
	constructor() {}
}
