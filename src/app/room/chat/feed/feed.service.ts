import { Injectable } from '@angular/core';
import { combineLatest, Observable, zip } from 'rxjs';
import { first, map, shareReplay, startWith, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { RoomService } from '@services/room.service';
import { UserService } from '@services/user.service';
import { FeedBuilder } from './feed-builder';
import { Feed } from './model/feed-entry';
import { isBefore } from 'date-fns/esm';
import { timestampToDate } from '@utilities/timestamp';
import { ChatService } from '../chat.service';

@Injectable({
	providedIn: 'root',
})
export class FeedService {
	/**
	 * The number of times the message feed has been loaded
	 */
	feedLoadCount = 0;
	/**
	 * Used to keep track of the reference time for the last read message
	 */
	private readonly initializationDate = new Date();

	private pendingWrites$ = this.roomService.chatHasPendingWrites$.pipe(startWith(false));

	private feedAuxiliaryStreams$: ReadonlyArray<Observable<unknown>> = [
		this.roomService.members$,
		this.userService.userUid$,
		this.userService.lastReadMessageStored$,
		this.chatService.lastReadMessage$.pipe(startWith(undefined)),
		this.roomService.lastPurge$,
	];

	feed$: Observable<Feed> = zip(...this.feedAuxiliaryStreams$).pipe(
		first(),
		switchMap(() =>
			combineLatest([
				this.roomService.messages$,
				this.roomService.reactions$,
				this.pendingWrites$,
			])
		),
		withLatestFrom(...this.feedAuxiliaryStreams$),
		tap(([[], members, userUid, lastReadMessageStored, lastReadMessage, lastPurge]) => {
			// If the last read message dates before the last purge, reset it
			if (
				lastReadMessageStored &&
				lastPurge &&
				isBefore(timestampToDate(lastReadMessageStored.createdAt), lastPurge)
			) {
				this.userService.updateLastReadMessage(null);
			}
		}),
		map(
			([
				[messages, reactions, pendingWrites],
				members,
				userUid,
				lastReadMessageStored,
				lastReadMessage,
				lastPurge,
			]) => {
				const feedBuilder = new FeedBuilder(
					messages,
					members,
					reactions,
					userUid,
					lastReadMessageStored,
					lastReadMessage,
					this.feedLoadCount,
					this.initializationDate,
					lastPurge,
					pendingWrites
				);

				return feedBuilder.feed();
			}
		),
		tap(() => {
			this.feedLoadCount++;
		}),
		shareReplay()
	);

	constructor(
		private roomService: RoomService,
		private userService: UserService,
		private chatService: ChatService
	) {}
}
