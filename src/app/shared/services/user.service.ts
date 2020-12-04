import { Injectable } from '@angular/core';
import { FirebaseUser } from '@services/auth.service';
import { debounce, distinctUntilChanged, filter, first, map, switchMap, tap } from 'rxjs/operators';
import { interval, Observable } from 'rxjs';
import { User } from '@model/user';
import { UserPersonalData } from '@model/user-personal-data';
import { DataService } from '@services/data.service';
import { ObservableStore } from '@codewithdan/observable-store';
import { Serialized } from '@utilities/data-transfer-object';
import { ConnectionState } from '@services/presence.service';

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
	/**
	 * User personal data
	 */
	userPersonalData$: Observable<UserPersonalData> = this.globalStateChanged.pipe(
		map((state) => state.userPersonalData),
		distinctUntilChanged()
	);
	connectionStatus$ = this.globalStateChanged.pipe(
		distinctUntilChanged((a, b) => a.connection_state === b.connection_state),
		map((state) => state.connection_state),
		debounce((state) => (state === 'offline' ? interval(10000) : interval(1000)))
	);

	constructor(private dataService: DataService) {
		super({});

		// Getting the user personal data
		this.userUid$
			.pipe(
				switchMap((uid) => this.dataService.userPersonalData$(uid).pipe(first())),
				tap((userPersonalData) => {
					this.setState({ userPersonalData }, 'USER_PERSONAL_DATA_CHANGE');
				})
			)
			.subscribe();
	}
}
