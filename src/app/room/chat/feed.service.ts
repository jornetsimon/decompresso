import { Injectable } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { Feed } from './model';
import { first, map, share, tap } from 'rxjs/operators';
import { RoomService } from '@services/room.service';
import { UserService } from '@services/user.service';
import { FeedBuilder } from './feed-builder';

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
	]).pipe(
		map(([messages, members, reactions, userUid, lastReadMessage]) => {
			const feedBuilder = new FeedBuilder(
				messages,
				members,
				reactions,
				userUid,
				lastReadMessage,
				this.feedLoadCount,
				this.initializationDate
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
