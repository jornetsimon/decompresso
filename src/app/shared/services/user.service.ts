import { Injectable } from '@angular/core';
import { FirebaseUser } from '@services/auth.service';
import {
	debounce,
	distinctUntilChanged,
	filter,
	first,
	map,
	shareReplay,
	switchMap,
} from 'rxjs/operators';
import { interval, Observable } from 'rxjs';
import { User } from '@model/user';
import { UserPersonalData } from '@model/user-personal-data';
import { DataService } from '@services/data.service';
import { ObservableStore } from '@codewithdan/observable-store';
import { Serialized } from '@utilities/data-transfer-object';
import { ConnectionState } from '@services/presence.service';
import { Message } from '@model/message';

interface StoreState {
	auth_credential: Serialized<FirebaseUser> | null | undefined;
	user: User | null;
	userPersonalData: UserPersonalData;
	connection_state: ConnectionState;
}

@Injectable({
	providedIn: 'root',
})
export class UserService extends ObservableStore<StoreState> {
	/**
	 * User UID
	 */
	userUid$ = this.globalStateChanged.pipe(
		map((state) => state?.auth_credential?.uid),
		filter((uid) => !!uid),
		distinctUntilChanged()
	) as Observable<string>;
	/**
	 * User public data
	 */
	user$ = this.globalStateChanged.pipe(
		map((state: StoreState) => state?.user),
		filter((user) => !!user),
		distinctUntilChanged()
	) as Observable<User>;
	connectionStatus$ = this.globalStateChanged.pipe(
		distinctUntilChanged((a, b) => a.connection_state === b.connection_state),
		map((state) => state.connection_state),
		debounce((state) => (state === 'offline' ? interval(10000) : interval(1000)))
	);
	lastReadMessageStored$: Observable<Message | null> = this.userUid$.pipe(
		first(),
		switchMap((userUid) => this.dataService.userReading$(userUid)),
		map((reading) => reading?.last_read_message || null),
		distinctUntilChanged((a, b) => a?.uid === b?.uid),
		shareReplay(1)
	);

	constructor(private dataService: DataService) {
		super({});
	}

	updateLastReadMessage(message: Message | null) {
		return this.userUid$
			.pipe(
				first(),
				switchMap((userUid) =>
					this.dataService
						.userReadingDoc(userUid)
						.set({ last_read_message: message }, { merge: true })
				)
			)
			.toPromise();
	}
}
