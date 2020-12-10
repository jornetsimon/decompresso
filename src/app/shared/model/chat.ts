import { Message } from '@model/message';
import { Reaction } from '@model/reaction';
import { Timestamp } from '@utilities/timestamp';

export interface Chat {
	messages: ReadonlyArray<Message>;
	reactions: ReadonlyArray<Reaction>;
	last_purge: Timestamp;
}
