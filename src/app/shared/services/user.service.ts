import { Injectable } from '@angular/core';
import { FirebaseUser } from '@services/auth.service';
import { distinctUntilChanged, filter, first, map, switchMap, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { User } from '@model/user';
import { UserPersonalData } from '@model/user-personal-data';
import { DataService } from '@services/data.service';
import { ObservableStore } from '@codewithdan/observable-store';
import { Serialized } from '@utilities/data-transfer-object';

interface StoreState {
	auth_credential: Serialized<FirebaseUser> | null | undefined;
	user: User | null;
	userPersonalData: UserPersonalData;
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

	updatePersonalData(data: Partial<UserPersonalData>) {
		return this.userUid$.pipe(
			switchMap((uid) => this.dataService.userPersonalDataDoc(uid).update(data))
		);
	}
}
