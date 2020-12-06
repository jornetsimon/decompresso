import { Injectable } from '@angular/core';
import { RoomService } from '@services/room.service';
import { UserService } from '@services/user.service';
import {
	debounceTime,
	distinctUntilChanged,
	filter,
	first,
	map,
	scan,
	share,
	shareReplay,
	startWith,
	switchMap,
	tap,
	withLatestFrom,
} from 'rxjs/operators';
import { DataService } from '@services/data.service';
import { combineLatest, Observable, Subject, throwError } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { Message } from '@model/message';
import firebase from 'firebase/app';
import { Reaction, ReactionType } from '@model/reaction';
import {
	LastReadMessageFeedEntry,
	MappedMessage,
	MessageFeed,
	MessageFeedEntry,
	MessageGroup,
	MessageReactions,
} from './model';
import { differenceInMinutes, fromUnixTime, isAfter, isBefore, isEqual } from 'date-fns/esm';
import { timestampToDate } from '@utilities/timestamp';
import { GLOBAL_CONFIG } from '../../global-config';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import firestore = firebase.firestore;

const hash = require('object-hash');

const FieldValue = firestore.FieldValue;

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class ChatService {
	/**
	 * The number of times the message feed has been loaded
	 */
	feedLoadCount = 0;

	/**
	 * Formatted messages and reactions
	 */
	messageFeed$: Observable<MessageFeed> = combineLatest([
		this.roomService.messages$,
		this.roomService.members$.pipe(first()),
		this.roomService.reactions$,
		this.userService.userUid$.pipe(first()),
		this.roomService.lastReadMessageStored$.pipe(first()),
	]).pipe(
		map(([messages, members, reactions, userUid, lastReadMessage]) => {
			const messageEntries: ReadonlyArray<MessageFeedEntry> = messages
				.map(
					(message): MappedMessage => {
						const messageReactions: MessageReactions = (reactions || [])
							.filter((r) => r.message === message.uid)
							.map((r) => {
								return {
									...r,
									nickname: members.find((m) => m.uid === r.user)?.nickname,
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
									!!messageReactions.like?.filter((r) => r.user === userUid)
										.length || false,
								dislike:
									!!messageReactions.dislike?.filter((r) => r.user === userUid)
										.length || false,
							},
						};
					}
				)
				.reduce(
					ChatService.groupMessagesByDateAndAuthor,
					[] as ReadonlyArray<MessageGroup<MappedMessage>>
				)
				.map(
					(messageGroup: MessageGroup<MappedMessage>, index): MessageFeedEntry => {
						return {
							type: 'message',
							...messageGroup,
							authorUser: members.find((m) => m.uid === messageGroup.author),
							isMine: messageGroup.author === userUid,
							isLast: index === messages.length - 1,
							isFresh: this.feedLoadCount !== 0,
						};
					}
				);

			const messagesFromOthers = messages.filter((m) => m.author !== userUid);
			let lastReadMessageEntry: ReadonlyArray<LastReadMessageFeedEntry> = [];
			if (lastReadMessage) {
				const isThereMessagesSinceLastRead = isBefore(
					fromUnixTime(lastReadMessage.createdAt.seconds),
					fromUnixTime(
						messagesFromOthers[messagesFromOthers.length - 1].createdAt.seconds
					)
				);
				if (isThereMessagesSinceLastRead) {
					const matchedEntryTimestamp = messageEntries
						.filter((entry) => !entry.isMine)
						.find(
							(entry) =>
								!!entry.messages.find((message) =>
									isAfter(
										fromUnixTime(message.createdAt.seconds),
										fromUnixTime(lastReadMessage!.createdAt.seconds)
									)
								)
						)!.timestamp;
					lastReadMessageEntry = [
						{
							type: 'last-read-message',
							timestamp: matchedEntryTimestamp,
						},
					];
				}
			}

			return [...messageEntries, ...lastReadMessageEntry].sort((a, b) => {
				const aDate = fromUnixTime(a.timestamp.seconds);
				const bDate = fromUnixTime(b.timestamp.seconds);
				if (isEqual(aDate, bDate)) {
					return a.type === 'last-read-message' ? -1 : 1;
				}
				return isBefore(aDate, bDate) ? -1 : 1;
			});
		}),
		tap(() => {
			this.feedLoadCount++;
		}),
		share()
	);
	/**
	 * Checks if there is more than two members in the room
	 */
	roomHasMultipleMembers$ = this.roomService.members$.pipe(
		map((members) => members.length >= 2),
		shareReplay(1)
	);

	mentionRegex = ChatService.getRegExp('@');

	private readingStateSubject = new Subject<Message>();
	readingState$ = this.readingStateSubject.asObservable().pipe(
		scan(ChatService.latestMessageReduceFn, undefined),
		distinctUntilChanged((a, b) => a?.uid === b?.uid)
	);

	lastReadMessage$ = combineLatest([
		this.roomService.lastReadMessageStored$,
		this.readingState$.pipe(startWith(undefined), debounceTime(500)),
	]).pipe(
		map(([latestStored, latestLocal]) => {
			if (latestStored && latestLocal) {
				return isAfter(
					fromUnixTime(latestStored.createdAt.seconds),
					fromUnixTime(latestLocal.createdAt.seconds)
				)
					? latestStored
					: latestLocal;
			} else {
				if (!(latestStored || latestLocal)) {
					return undefined;
				}
				return latestStored || latestLocal;
			}
		})
	);

	constructor(
		private roomService: RoomService,
		private userService: UserService,
		private dataService: DataService,
		private afs: AngularFirestore
	) {
		this.readingState$
			.pipe(
				debounceTime(500),
				withLatestFrom(this.roomService.lastReadMessageStored$),
				filter(
					([lastReadMessage, lastReadMessageStored]) =>
						lastReadMessage?.uid !== lastReadMessageStored?.uid
				),
				untilDestroyed(this)
			)
			.subscribe(([lastReadMessage]) => {
				if (lastReadMessage) {
					console.log('Updating last read message');
					this.roomService.updateMemberLastReadMessage(lastReadMessage);
				}
			});
	}

	/**
	 * Reducer function to group messages by adjacent author
	 * @param groupedMessages The array of message groups
	 * @param currentMessage The currently processed message
	 * @param index Index of the currently processed message
	 * @param messages Source array of messages
	 */
	static groupMessagesByDateAndAuthor<T extends Message>(
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

	static latestMessageReduceFn(greatest: Message | undefined, current: Message) {
		const currentDate = fromUnixTime(current.createdAt.seconds);
		const greatestDate = greatest ? fromUnixTime(greatest.createdAt.seconds) : null;
		if (!greatestDate || isAfter(currentDate, greatestDate)) {
			return current;
		} else {
			return greatest;
		}
	}

	static getRegExp(prefix: string | readonly string[]): RegExp {
		const prefixArray = Array.isArray(prefix) ? prefix : [prefix];
		let prefixToken = prefixArray.join('').replace(/([$^])/g, '\\$1');

		if (prefixArray.length > 1) {
			prefixToken = `[${prefixToken}]`;
		}
		return new RegExp(`(\\s|^)(${prefixToken})[^\\s]*`, 'g');
	}

	sendMessage(content: string) {
		return combineLatest([
			this.userService.userUid$.pipe(first()),
			this.roomService.room$.pipe(first()),
		])
			.pipe(
				switchMap(([userUid, room]) => {
					const message: Omit<Message, 'createdAt'> & { createdAt: Date } = {
						uid: this.afs.createId(),
						createdAt: new Date(),
						author: userUid,
						content,
					};
					return this.dataService
						.chatDoc(room.domain)
						.update({ messages: FieldValue.arrayUnion(message) as any });
				})
			)
			.toPromise();
	}

	deleteMessage(message: MappedMessage) {
		return combineLatest([
			this.userService.userUid$.pipe(first()),
			this.roomService.room$.pipe(first()),
		])
			.pipe(
				switchMap(([userUid, room]) => {
					if (userUid !== message.author) {
						return throwError(new Error('deletion_forbidden_for_this_user'));
					}
					const data: Message = {
						uid: message.uid,
						author: message.author,
						createdAt: message.createdAt,
						content: message.content,
					};
					return this.dataService
						.chatDoc(room.domain)
						.update({ messages: FieldValue.arrayRemove(data) as any });
				})
			)
			.toPromise();
	}

	toggleReaction(message: Message, reactionType: ReactionType) {
		return combineLatest([
			this.userService.userUid$.pipe(first()),
			this.roomService.room$.pipe(first()),
			this.roomService.reactions$.pipe(first()),
		])
			.pipe(
				switchMap(([userUid, room, reactions]) => {
					const existingReactions = (reactions || []).filter(
						(m) => m.message === message.uid
					);
					const isAlreadySet = existingReactions.find(
						(r) => r.user === userUid && r.type === reactionType
					);
					const reaction: Reaction = {
						message: message.uid,
						user: userUid,
						type: reactionType,
					};
					if (isAlreadySet) {
						// Remove the reaction from the array
						return this.dataService.chatDoc(room.domain).update({
							reactions: FieldValue.arrayRemove(reaction) as any,
						});
					} else {
						// Add the reaction to the array
						return this.dataService.chatDoc(room.domain).update({
							reactions: FieldValue.arrayUnion(reaction) as any,
						});
					}
				})
			)
			.toPromise();
	}

	trackMessageAsRead(message: Message) {
		this.readingStateSubject.next(message);
	}
}
