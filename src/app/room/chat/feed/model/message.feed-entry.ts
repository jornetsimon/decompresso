import { FeedEntry } from './feed-entry';
import { Message } from '@model/message';
import { MappedMessage } from './message/mapped-message';
import { User } from '@model/user';

export interface MessageFeedEntry extends FeedEntry<'message'> {
	author: Message['author'];
	messages: ReadonlyArray<MappedMessage>;
	authorUser: (User & { uid: string }) | undefined;
	isMine: boolean;
	isLast: boolean;
	isFresh: boolean;
}

export function isMessageFeedEntry(entry: FeedEntry<unknown>): entry is MessageFeedEntry {
	return entry.type === 'message';
}
