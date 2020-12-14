import { Message } from '@model/message';
import { RoomMember } from '@model/room-member';
import { Reaction } from '@model/reaction';
import {
	differenceInMinutes,
	format,
	fromUnixTime,
	isAfter,
	isBefore,
	isEqual,
	isWithinInterval,
	startOfWeek,
} from 'date-fns/esm';
import { dateToTimestamp, timestampToDate } from '@utilities/timestamp';
import { GLOBAL_CONFIG } from '../../../global-config';
import { MessageGroup } from './model/message/message-group';
import { Feed, FeedEntry } from './model/feed-entry';
import { MappedMessage } from './model/message/mapped-message';
import { MessageReactions } from './model/message/message-reactions';
import { LastReadMessageFeedEntry } from './model/last-read-message.feed-entry';
import { MessageFeedEntry } from './model/message.feed-entry';
import { SystemFeedEntry } from './model/system.feed-entry';
import { fr } from 'date-fns/locale';

export class FeedBuilder {
	constructor(
		private messages: ReadonlyArray<Message>,
		private members: ReadonlyArray<RoomMember>,
		private reactions: ReadonlyArray<Reaction> | undefined,
		private userUid: string,
		private lastReadMessage: Message | null,
		private feedLoadCount: number,
		private initializationDate: Date,
		private lastPurge: Date | undefined
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
		if (this.lastReadMessage && messagesFromOthers.length) {
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

	private buildSystemEntries(): ReadonlyArray<SystemFeedEntry> {
		const purgeEntry: ReadonlyArray<SystemFeedEntry> = this.lastPurge
			? [
					{
						type: 'system',
						timestamp: dateToTimestamp(this.lastPurge),
						color: '#767676',
						content: `Dernière purge effectuée ${format(this.lastPurge, 'EEEE', {
							locale: fr,
							weekStartsOn: 1,
						})} matin`,
						icon: '🧹',
					},
			  ]
			: [];
		const memberJoinEntries: ReadonlyArray<SystemFeedEntry> = this.members
			.filter((member) =>
				isWithinInterval(fromUnixTime(member.createdAt.seconds), {
					start: this.lastPurge || startOfWeek(Date.now(), { weekStartsOn: 1 }),
					end: Date.now(),
				})
			)
			.map((member) => {
				return {
					type: 'system',
					timestamp: member.createdAt,
					color: '#c71c8e',
					content: `${member.nickname} a rejoint le salon`,
					icon: '🐣',
				};
			});

		return [...purgeEntry, ...memberJoinEntries];
	}

	feed(): Feed {
		return [
			...this.buildMessageEntries(),
			...this.buildLastReadMessageEntries(),
			...this.buildSystemEntries(),
		].sort(FeedBuilder.feedSortFn);
	}
}
