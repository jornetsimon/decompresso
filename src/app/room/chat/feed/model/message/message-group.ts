import { Message } from '@model/message';

export interface MessageGroup<T extends Message> {
	timestamp: Message['createdAt'];
	author: Message['author'];
	messages: ReadonlyArray<T>;
}
