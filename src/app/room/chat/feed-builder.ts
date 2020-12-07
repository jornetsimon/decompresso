import { Message } from '@model/message';
import { RoomMember } from '@model/room-member';
import { Reaction } from '@model/reaction';
import {
	Feed,
	FeedEntry,
	LastReadMessageFeedEntry,
	MappedMessage,
	MessageFeedEntry,
	MessageGroup,
	MessageReactions,
} from './model';
import { differenceInMinutes, fromUnixTime, isAfter, isBefore, isEqual } from 'date-fns/esm';
import { timestampToDate } from '@utilities/timestamp';
import { GLOBAL_CONFIG } from '../../global-config';

export class FeedBuilder {
	constructor(
		private messages: ReadonlyArray<Message>,
		private members: ReadonlyArray<RoomMember>,
		private reactions: ReadonlyArray<Reaction> | undefined,
		private userUid: string,
		private lastReadMessage: Message | undefined,
		private feedLoadCount: number,
		private initializationDate: Date
	) {}

	/**
	 * Reducer function to group messages by adjacent author
	 * @param groupedMessages The array of message groups
	 * @param currentMessage The currently processed message
	 * @param index Index of the currently processed message
	 * @param messages Source array of messages
	 */
	private static groupMessagesByDateAndAuthor<T extends Message>(
		groupedMessages: ReadonlyArray<MessageGroup<T>>,
		currentMessage: T,
		index: number,
		messages: ReadonlyArray<T>
	): ReadonlyArray<MessageGroup<T>> {
		const lastMessage: T | undefined = messages.slice(index - 1, index)[0];
		const isSameAuthor = lastMessage?.author === currentMessage.author;
		if (isSameAuthor) {
			// This message belongs to the previous group since it has the same author
			const lastGroupIndex = groupedMessages.length - 1;
			const lastGroup = groupedMessages[lastGroupIndex];

			// Checking if a new group should be created based on the time difference with the last message
			const lastMessageOfLastGroup = lastGroup.messages[lastGroup.messages.length - 1];
			const differenceInMinutesWithLastMessage = differenceInMinutes(
				timestampToDate(currentMessage.createdAt),
				timestampToDate(lastMessageOfLastGroup.createdAt)
			);
			if (
				differenceInMinutesWithLastMessage > GLOBAL_CONFIG.chat.groupMessagesWithinMinutes
			) {
				const newGroup: MessageGroup<T> = {
					timestamp: currentMessage.createdAt,
					author: currentMessage.author,
					messages: [currentMessage],
				};
				return [...groupedMessages, newGroup];
			}

			const updatedLastGroup: MessageGroup<T> = {
				...groupedMessages[lastGroupIndex],
				messages: [...lastGroup.messages, currentMessage],
			};
			return [...groupedMessages.slice(0, groupedMessages.length - 1), updatedLastGroup];
		} else {
			const newGroup: MessageGroup<T> = {
				timestamp: currentMessage.createdAt,
				author: currentMessage.author,
				messages: [currentMessage],
			};
			return [...groupedMessages, newGroup];
		}
	}

	private static feedSortFn(a: FeedEntry<unknown>, b: FeedEntry<unknown>) {
		const aDate = fromUnixTime(a.timestamp.seconds);
		const bDate = fromUnixTime(b.timestamp.seconds);
		if (isEqual(aDate, bDate)) {
			return a.type === 'last-read-message' ? -1 : 1;
		}
		return isBefore(aDate, bDate) ? -1 : 1;
	}

	private buildMessageEntries(): ReadonlyArray<MessageFeedEntry> {
		return this.messages
			.map(
				(message): MappedMessage => {
					const messageReactions: MessageReactions = (this.reactions || [])
						.filter((r) => r.message === message.uid)
						.map((r) => {
							return {
								...r,
								nickname: this.members.find((m) => m.uid === r.user)?.nickname,
							};
						})
						.reduce((acc, reaction) => {
							const type = reaction.type;
							return {
								...acc,
								[type]: [...(acc[type] || []), reaction],
							};
						}, {});
					return {
						...message,
						reactions: messageReactions,
						myReactions: {
							like:
								!!messageReactions.like?.filter((r) => r.user === this.userUid)
									.length || false,
							dislike:
								!!messageReactions.dislike?.filter((r) => r.user === this.userUid)
									.length || false,
						},
					};
				}
			)
			.reduce(
				FeedBuilder.groupMessagesByDateAndAuthor,
				[] as ReadonlyArray<MessageGroup<MappedMessage>>
			)
			.map(
				(messageGroup: MessageGroup<MappedMessage>, index): MessageFeedEntry => {
					return {
						type: 'message',
						...messageGroup,
						authorUser: this.members.find((m) => m.uid === messageGroup.author),
						isMine: messageGroup.author === this.userUid,
						isLast: index === this.messages.length - 1,
						isFresh: this.feedLoadCount !== 0,
					};
				}
			);
	}

	private buildLastReadMessageEntries(): ReadonlyArray<LastReadMessageFeedEntry> {
		const messagesFromOthers = this.messages.filter(
			// We want only the messages from other users, but not since the first load
			(m) =>
				m.author !== this.userUid &&
				isBefore(fromUnixTime(m.createdAt.seconds), this.initializationDate)
		);
		if (this.lastReadMessage) {
			const isThereMessagesSinceLastRead = isBefore(
				fromUnixTime(this.lastReadMessage.createdAt.seconds),
				fromUnixTime(messagesFromOthers[messagesFromOthers.length - 1].createdAt.seconds)
			);
			if (isThereMessagesSinceLastRead) {
				const matchedEntryTimestamp = this.buildMessageEntries()
					.filter((entry) => !entry.isMine)
					.find(
						(entry) =>
							!!entry.messages.find((message) =>
								isAfter(
									fromUnixTime(message.createdAt.seconds),
									fromUnixTime(this.lastReadMessage!.createdAt.seconds)
								)
							)
					)!.timestamp;
				return [
					{
						type: 'last-read-message',
						timestamp: matchedEntryTimestamp,
					},
				];
			}
		}
		return [];
	}

	feed(): Feed {
		return [...this.buildMessageEntries(), ...this.buildLastReadMessageEntries()].sort(
			FeedBuilder.feedSortFn
		);
	}
}
