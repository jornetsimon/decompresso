import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AngularFireAuth } from '@angular/fire/auth';
import { combineLatest, from, Observable, of, throwError } from 'rxjs';
import { ObservableStore } from '@codewithdan/observable-store';
import {
	delay,
	distinctUntilChanged,
	filter,
	first,
	map,
	retryWhen,
	switchMap,
	take,
	tap,
	timeoutWith,
} from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Serialized } from '@utilities/data-transfer-object';
import { serialize } from '@utilities/serialize';
import { User } from '@model/user';
import { DataService } from './data.service';
import firebase from 'firebase';

export type FirebaseUser = firebase.User;
export type FirebaseUserCredential = firebase.auth.UserCredential;

interface StoreState {
	auth_credential: Serialized<FirebaseUser> | null | undefined;
	user: User | null | undefined;
}

export enum AuthType {
	Created = 'created',
	LoggedIn = 'loggedIn',
}

/**
 * Authentication service
 */
@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class AuthService extends ObservableStore<StoreState> {
	/**
	 * Has the authentication been checked?
	 */
	isAuthChecked$ = this.stateChanged.pipe(map((state) => state.auth_credential !== undefined));
	/**
	 * Emits when the authentication has been checked
	 */
	waitForAuthChecked$ = this.isAuthChecked$.pipe(
		filter((checked) => checked),
		first()
	);
	/**
	 * The Firebase Auth user credential
	 */
	authCredential$: Observable<FirebaseUser | null> = this.auth.user;
	/**
	 * Is the user authenticated
	 */
	isAuthenticated$: Observable<boolean> = this.auth.user.pipe(map((user) => !!user));

	/**
	 * The connected user data
	 */
	user$: Observable<User | null> = this.globalStateChanged.pipe(
		filter((state) => state.user !== undefined),
		map((state: StoreState) => state.user as User | null),
		distinctUntilChanged()
	);

	constructor(
		private fns: AngularFireFunctions,
		private auth: AngularFireAuth,
		private dataService: DataService
	) {
		super({});

		// Initialize auth state
		this.setState({ auth_credential: undefined, user: undefined }, 'INIT_AUTH_STATE');

		// When the authenticated user changes, update state
		// This is triggered by automatic auth process, login and logout
		this.auth.user
			.pipe(
				// Update auth_credential state
				tap((auth_credential) => {
					this.setState(
						{ auth_credential: serialize(auth_credential) },
						'AUTH_CREDENTIAL_CHANGE'
					);
				}),
				// Map the auth credential to its user data in DB
				switchMap((auth_credential) => {
					if (!auth_credential) {
						return of(null);
					}
					return this.dataService.user$(auth_credential.uid).pipe(
						first(),
						// The request will be retried every 2 seconds for 5 times
						retryWhen((errors) => errors.pipe(delay(2000), take(5))),
						map((user) => (user ? user : null))
					);
				}),
				// Update user state
				tap((user: User | null) => {
					this.setState({ user }, 'AUTH_USER_CHANGE');
				}),
				untilDestroyed(this)
			)
			.subscribe();
	}

	signupWithEmailPassword(email: string, password: string) {
		return this.auth.createUserWithEmailAndPassword(email, password);
	}
	loginWithEmailPassword(email: string, password: string) {
		return this.auth.signInWithEmailAndPassword(email, password);
	}

	/**
	 * Load a user or create their account in database
	 */
	loginOrCreateAccount(): Observable<{ authType: AuthType; user: User }> {
		return this.authCredential$.pipe(
			filter((authUser) => !!authUser),
			timeoutWith(10000, throwError(new Error('missing_auth_user'))),
			switchMap((authUser: FirebaseUser) =>
				this.dataService.user$(authUser.uid).pipe(
					take(1),
					switchMap((user) => {
						if (!user) {
							// No user found in database
							return this.createUser().pipe(
								map((createdUser) => {
									return {
										authType: AuthType.Created,
										user: createdUser,
									};
								})
							);
						}
						return of({ authType: AuthType.LoggedIn, user });
					})
				)
			),
			take(1),
			tap({
				next: (authResult) => {
					this.setState({ user: authResult.user }, 'USER_LOGGED_IN');
					window.localStorage.setItem('is-known', 'true');
				},
			})
		);
	}

	/**
	 * Log the user out and wait for the state to be propagated
	 */
	logout() {
		// Adding isAuthenticated$ in the mix to ensure subsequent uses can have a properly updated state
		return combineLatest([from(this.auth.signOut()), this.isAuthenticated$]).pipe(
			filter(([signOut, isAuthenticated]) => !isAuthenticated),
			first()
		);
	}

	/**
	 * Calls a cloud function to create a user account in the database.
	 * Requires the user to be authenticated.
	 */
	private createUser() {
		const callable = this.fns.httpsCallable('createUser');
		return callable({});
	}

	/**
	 * Delete a user account
	 *
	 * Removes their data in db and delete their auth account
	 */
	deleteUser() {
		const callable = this.fns.httpsCallable('deleteUser');
		return callable({});
	}
}
