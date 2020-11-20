import { Injectable } from '@angular/core';
import { RoomService } from '@services/room.service';
import { UserService } from '@services/user.service';
import { first, switchMap } from 'rxjs/operators';
import { DataService } from '@services/data.service';
import { combineLatest } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { Message } from '@model/message';
import firebase from 'firebase/app';
import { MessageGroup } from '@model/message-group';
import { Reaction, ReactionType } from '@model/reaction';
import firestore = firebase.firestore;

const FieldValue = firestore.FieldValue;

@Injectable({
	providedIn: 'root',
})
export class ChatService {
	constructor(
		private roomService: RoomService,
		private userService: UserService,
		private dataService: DataService,
		private afs: AngularFirestore
	) {}

	/**
	 * Reducer function to group messages by adjacent author
	 * @param groupedMessages Accumulator
	 * @param currentMessage The currently processed message
	 * @param index Index of the currently processed message
	 * @param messages Source array of messages
	 */
	static groupMessagesByDateAndAuthor = (
		groupedMessages: ReadonlyArray<MessageGroup>,
		currentMessage: Message,
		index: number,
		messages: ReadonlyArray<Message>
	): ReadonlyArray<MessageGroup> => {
		const lastMessage: Message | undefined = messages.slice(index - 1, index)[0];
		const isSameAuthor = lastMessage?.author === currentMessage.author;
		if (isSameAuthor) {
			// This message belongs to the previous group since it has the same author
			const lastGroupIndex = groupedMessages.length - 1;
			const lastGroup = groupedMessages[lastGroupIndex];
			const updatedLastGroup: MessageGroup = {
				...groupedMessages[lastGroupIndex],
				messages: [...lastGroup.messages, currentMessage],
			};
			return [...groupedMessages.slice(0, groupedMessages.length - 1), updatedLastGroup];
		} else {
			const newGroup: MessageGroup = {
				timestamp: currentMessage.createdAt,
				author: currentMessage.author,
				messages: [currentMessage],
			};
			return [...groupedMessages, newGroup];
		}
	};

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
