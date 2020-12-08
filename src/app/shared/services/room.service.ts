import { Injectable } from '@angular/core';
import { ObservableStore } from '@codewithdan/observable-store';
import { Room } from '@model/room';
import {
	distinctUntilChanged,
	filter,
	first,
	map,
	shareReplay,
	switchMap,
	takeUntil,
	withLatestFrom,
} from 'rxjs/operators';
import { UserService } from '@services/user.service';
import { DataService, expectData } from '@services/data.service';
import { Observable } from 'rxjs';
import { User } from '@model/user';
import { Chat } from '@model/chat';
import { Message } from '@model/message';
import { timestampToDate } from '@utilities/timestamp';
import { isBefore } from 'date-fns/esm';
import { Reaction } from '@model/reaction';
import { ActivityService } from '@services/activity.service';
import { RoomMember } from '@model/room-member';

const hash = require('object-hash');

interface StoreState {
	room: Room;
}
@Injectable({
	providedIn: 'root',
})
export class RoomService extends ObservableStore<StoreState> {
	/**
	 * Long-lived room data
	 */
	room$: Observable<Room> = this.userService.user$.pipe(
		switchMap((user) => this.dataService.room$(user.domain)),
		expectData,
		shareReplay(1)
	);
	/**
	 * Long lived room member data matching the connected user
	 */
	member$: Observable<RoomMember> = this.userService.user$.pipe(
		withLatestFrom(this.userService.userUid$),
		switchMap(([user, uid]) => this.dataService.roomMember$(user.domain, uid)),
		expectData,
		distinctUntilChanged((a, b) => hash(a || {}) === hash(b || {})),
		shareReplay(1)
	);
	/**
	 * Long lived room members data
	 */
	members$: Observable<ReadonlyArray<RoomMember>> = this.userService.user$.pipe(
		switchMap((user) =>
			this.dataService.roomMembers$(user.domain).pipe(
				expectData,
				map((members) =>
					members
						.sort((a, b) => RoomService.memberSortFn(a, b, user))
						.filter((member, index, array) => {
							// Exclude duplicates by nickname that are deleted (for users that recreated an account)
							return !(
								member.deleted &&
								!!array.find((m) => m.nickname === member.nickname)
							);
						})
				)
			)
		),
		shareReplay(1)
	);
	/**
	 * Stream of chat data
	 * Disconnect when the user is inactive and reconnect when they come back
	 */
	chat$: Observable<Chat> = this.activityService.isActive$.pipe(
		distinctUntilChanged(),
		filter((isActive) => isActive),
		switchMap(() => this.room$.pipe(first())),
		switchMap((room) =>
			this.dataService
				.chat$(room.domain)
				.pipe(
					expectData,
					takeUntil(this.activityService.isActive$.pipe(filter((isActive) => !isActive)))
				)
		),
		shareReplay(1)
	);
	messages$: Observable<ReadonlyArray<Message>> = this.chat$.pipe(
		map((chat) => chat.messages),
		distinctUntilChanged((a, b) => hash(a || {}) === hash(b || {})),
		map((messages) => [...messages].sort(RoomService.messageSortFn))
	);
	reactions$: Observable<ReadonlyArray<Reaction>> = this.chat$.pipe(
		map((chat) => chat.reactions),
		distinctUntilChanged((a, b) => {
			return hash(a || {}) === hash(b || {});
		})
	);
	lastReadMessageStored$ = this.member$.pipe(
		map((member) => member.last_read_message),
		distinctUntilChanged((a, b) => a?.uid === b?.uid)
	);

	constructor(
		private userService: UserService,
		private dataService: DataService,
		private activityService: ActivityService
	) {
		super({});
	}

	private static memberSortFn(a: User, b: User, connectedUser: User): -1 | 0 | 1 {
		const aNick = a.nickname;
		const bNick = b.nickname;
		const connectedUserNick = connectedUser.nickname;
		if (aNick === connectedUserNick) {
			return -1;
		}
		if (bNick === connectedUserNick) {
			return 1;
		}
		if (!a.deleted && !b.deleted) {
			if (a.state === b.state) {
				return aNick < bNick ? -1 : 1;
			} else {
				// Put online first
				return a.state === 'online' ? -1 : 1;
			}
		} else {
			// Put deleted at bottom
			return a.deleted ? 1 : -1;
		}
	}
	private static messageSortFn(a: Message, b: Message): -1 | 0 | 1 {
		const aDate = timestampToDate(a.createdAt);
		const bDate = timestampToDate(b.createdAt);
		return isBefore(aDate, bDate) ? -1 : 1;
	}

	updateMemberLastReadMessage(message: Message) {
		return this.member$
			.pipe(
				first(),
				switchMap((member) =>
					this.dataService
						.roomMemberDoc(member.domain, member.uid)
						.update({ last_read_message: message })
				)
			)
			.toPromise();
	}
}
