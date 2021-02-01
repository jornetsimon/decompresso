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
	shareReplay,
	switchMap,
	withLatestFrom,
} from 'rxjs/operators';
import { DataService } from '@services/data.service';
import { combineLatest, Subject, throwError } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { Message } from '@model/message';
import firebase from 'firebase/app';
import { Reaction, ReactionType } from '@model/reaction';
import { fromUnixTime, isAfter } from 'date-fns/esm';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MappedMessage } from './feed/model/message/mapped-message';
import { Report } from '@model/report';
import { dateToTimestamp } from '@utilities/timestamp';
import firestore = firebase.firestore;

const FieldValue = firestore.FieldValue;

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class ChatService {
	/**
	 * Checks if there is more than two members in the room
	 */
	roomHasMultipleMembers$ = this.roomService.membersWithoutDeleted$.pipe(
		map((members) => members.length >= 2),
		shareReplay(1)
	);

	private readingStateSubject = new Subject<Message>();
	readingState$ = this.readingStateSubject.asObservable();

	/**
	 * Emits the latest message read by the user, based on local events
	 */
	lastReadMessage$ = this.readingState$.pipe(
		scan(ChatService.latestMessageReduceFn, undefined),
		distinctUntilChanged((a, b) => a?.uid === b?.uid)
	);

	constructor(
		private roomService: RoomService,
		private userService: UserService,
		private dataService: DataService,
		private afs: AngularFirestore
	) {
		/**
		 * When the latest read message changes
		 */
		this.lastReadMessage$
			.pipe(
				withLatestFrom(this.userService.userUid$),
				// Ignore the user's own messages
				filter(([lastReadMessage, userUid]) => lastReadMessage?.author !== userUid),
				map(([lastReadMessage]) => lastReadMessage),
				debounceTime(500),
				withLatestFrom(this.userService.lastReadMessageStored$),
				filter(
					// Only when the message ID differs from the one stored in DB
					([lastReadMessage, lastReadMessageStored]) =>
						lastReadMessage?.uid !== lastReadMessageStored?.uid
				),
				untilDestroyed(this)
			)
			.subscribe(([lastReadMessage]) => {
				if (lastReadMessage) {
					console.log('Updating last read message');
					// Store it in the DB
					this.userService.updateLastReadMessage(lastReadMessage);
				}
			});
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
	reportMessage(message: Message) {
		return combineLatest([
			this.roomService.member$.pipe(first()),
			this.roomService.members$.pipe(first()),
			this.roomService.room$.pipe(first()),
		])
			.pipe(
				switchMap(([member, members, room]) => {
					if (member.uid === message.author) {
						return throwError(new Error('report_forbidden_for_this_user'));
					}
					const report: Report = {
						report_author: member,
						message,
						message_author: members.find((m) => m.uid === message.author)!,
						createdAt: dateToTimestamp(new Date()),
						moderation: 'pending',
					};
					return this.dataService.reportsCol(room.domain).add(report as any);
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

	/**
	 * Tracks that a message has been read by the user
	 */
	trackMessageAsRead(message: Message) {
		this.readingStateSubject.next(message);
	}
}
