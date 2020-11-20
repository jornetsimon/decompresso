import { Message } from '@model/message';

export interface MessageGroup {
	timestamp: Message['createdAt'];
	author: Message['author'];
	messages: ReadonlyArray<Message>;
}
