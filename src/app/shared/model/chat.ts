import { Message } from '@model/message';

export interface Chat {
	messages: ReadonlyArray<Message>;
}
