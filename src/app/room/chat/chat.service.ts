import { Injectable } from '@angular/core';
import { RoomService } from '@services/room.service';
import { UserService } from '@services/user.service';
import { first, map, share, switchMap, tap } from 'rxjs/operators';
import { DataService } from '@services/data.service';
import { combineLatest, Observable } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { Message } from '@model/message';
import firebase from 'firebase/app';
import { Reaction, ReactionType } from '@model/reaction';
import { User } from '@model/user';
import firestore = firebase.firestore;

const FieldValue = firestore.FieldValue;

export type MessageFeed = ReadonlyArray<MessageFeedEntry>;
export type MessageFeedEntry = {
	timestamp: Message['createdAt'];
	author: Message['author'];
	messages: ReadonlyArray<MappedMessage>;
	authorUser: (User & { uid: string }) | undefined;
	isMine: boolean;
	isLast: boolean;
	isFresh: boolean;
};
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
		this.roomService.members$,
		this.roomService.reactions$,
		this.userService.userUid$,
	]).pipe(
		map(([messages, members, reactions, userUid]) => {
			return messages
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
				.map((messageGroup: MessageGroup<MappedMessage>, index) => {
					return {
						...messageGroup,
						authorUser: members.find((m) => m.uid === messageGroup.author),
						isMine: messageGroup.author === userUid,
						isLast: index === messages.length - 1,
						isFresh: this.feedLoadCount !== 0,
					};
				});
		}),
		tap(() => {
			this.feedLoadCount++;
		}),
		share()
	);
	constructor(
		private roomService: RoomService,
		private userService: UserService,
		private dataService: DataService,
		private afs: AngularFirestore
	) {}

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
}
