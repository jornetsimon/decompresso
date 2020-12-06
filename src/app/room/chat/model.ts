import { Reaction, ReactionType } from '@model/reaction';
import { Message } from '@model/message';
import { User } from '@model/user';

export type MessageFeed = ReadonlyArray<
	MessageFeedEntry | SystemFeedEntry | LastReadMessageFeedEntry
>;
export interface FeedEntry<T> {
	timestamp: Message['createdAt'];
	type: T;
}
export interface MessageFeedEntry extends FeedEntry<'message'> {
	author: Message['author'];
	messages: ReadonlyArray<MappedMessage>;
	authorUser: (User & { uid: string }) | undefined;
	isMine: boolean;
	isLast: boolean;
	isFresh: boolean;
}
export interface SystemFeedEntry extends FeedEntry<'system'> {}
export interface LastReadMessageFeedEntry extends FeedEntry<'last-read-message'> {}

export type MessageReactions = Partial<
	Record<ReactionType, ReadonlyArray<Reaction & { nickname: string }>>
>;
export type MappedMessage = Message & {
	reactions: MessageReactions;
	myReactions: Partial<Record<ReactionType, boolean>>;
};

export interface MessageGroup<T extends Message> {
	timestamp: Message['createdAt'];
	author: Message['author'];
	messages: ReadonlyArray<T>;
}

export function isMessageFeedEntry(entry: FeedEntry<unknown>): entry is MessageFeedEntry {
	return entry.type === 'message';
}
