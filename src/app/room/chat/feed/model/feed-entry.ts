import { Message } from '@model/message';

export type Feed = ReadonlyArray<FeedEntry<unknown>>;

export interface FeedEntry<T> {
	timestamp: Message['createdAt'];
	type: T;
}
