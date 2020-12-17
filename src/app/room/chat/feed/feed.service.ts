import { Injectable } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map, share, tap, withLatestFrom } from 'rxjs/operators';
import { RoomService } from '@services/room.service';
import { UserService } from '@services/user.service';
import { FeedBuilder } from './feed-builder';
import { Feed } from './model/feed-entry';
import { isBefore } from 'date-fns/esm';
import { timestampToDate } from '@utilities/timestamp';

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
	initializationDate = new Date();

	feed$: Observable<Feed> = combineLatest([
		this.roomService.messages$,
		this.roomService.members$.pipe(first()),
		this.roomService.reactions$,
		this.userService.userUid$.pipe(first()),
		this.roomService.lastReadMessageStored$.pipe(first()),
		this.roomService.lastPurge$.pipe(first()),
	]).pipe(
		tap(([messages, members, reactions, userUid, lastReadMessage, lastPurge]) => {
			// If the last read message dates before the last purge, reset it
			if (
				lastReadMessage &&
				lastPurge &&
				isBefore(timestampToDate(lastReadMessage.createdAt), lastPurge)
			) {
				console.log('resetting last read message');
				this.userService.updateLastReadMessage(null);
			}
		}),
		map(([messages, members, reactions, userUid, lastReadMessage, lastPurge]) => {
			const feedBuilder = new FeedBuilder(
				messages,
				members,
				reactions,
				userUid,
				lastReadMessage,
				this.feedLoadCount,
				this.initializationDate,
				lastPurge
			);

			return feedBuilder.feed();
		}),
		tap(() => {
			this.feedLoadCount++;
		}),
		share()
	);

	constructor(private roomService: RoomService, private userService: UserService) {}
}
