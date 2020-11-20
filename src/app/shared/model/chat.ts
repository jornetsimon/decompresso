import { Message } from '@model/message';
import { Reaction } from '@model/reaction';

export interface Chat {
	messages: ReadonlyArray<Message>;
	reactions?: ReadonlyArray<Reaction>;
}
