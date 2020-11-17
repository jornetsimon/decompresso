import { Injectable } from '@angular/core';
import { ObservableStore } from '@codewithdan/observable-store';
import { Room } from '@model/room';
import { map, share, switchMap } from 'rxjs/operators';
import { UserService } from '@services/user.service';
import { DataService, expectData } from '@services/data.service';
import { Observable } from 'rxjs';
import { User } from '@model/user';

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
		switchMap((user) => this.dataService.room$(user.domain).pipe(expectData))
	);
	members$: Observable<ReadonlyArray<User>> = this.userService.user$.pipe(
		switchMap((user) =>
			this.dataService.roomMembers$(user.domain).pipe(
				expectData,
				map((members) => members.sort((a, b) => RoomService.memberSortFn(a, b, user)))
			)
		),
		share()
	);
	constructor(private userService: UserService, private dataService: DataService) {
		super({});
	}

	private static memberSortFn(a: User, b: User, connectedUser: User): -1 | 0 | 1 {
		// Put deleted at bottom
		if (a.deleted) {
			return 1;
		}
		if (b.deleted) {
			return -1;
		}
		const aNick = a.nickname;
		const bNick = b.nickname;
		const connectedUserNick = connectedUser.nickname;
		if (aNick === connectedUserNick) {
			return -1;
		}
		if (bNick === connectedUserNick) {
			return 1;
		}
		return aNick < bNick ? -1 : 1;
	}
}
