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
	retry,
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
import { PresenceService } from '@services/presence.service';

export type FirebaseUser = firebase.User;
export type FirebaseUserCredential = firebase.auth.UserCredential;

interface StoreState {
	auth_credential: Serialized<FirebaseUser> | null | undefined;
	user: User | null | undefined;
}

export enum AuthType {
	PendingVerification = 'pendingVerification',
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
		private dataService: DataService,
		private presenceService: PresenceService
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
						map((user) => (user ? user : null)),
						tap((user) => {
							if (user) {
								this.presenceService.trackPresence();
							}
						})
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
	loginOrCreateAccount(): Observable<{
		authType: AuthType;
		user?: User;
		authUser: FirebaseUser;
	}> {
		return this.authCredential$.pipe(
			filter((authUser) => !!authUser),
			timeoutWith(10000, throwError(new Error('missing_auth_user'))),
			take(1),
			switchMap((authUser: FirebaseUser) => {
				if (!authUser.emailVerified) {
					return of({ authType: AuthType.PendingVerification, authUser });
				}
				return this.dataService.user$(authUser.uid).pipe(
					take(1),
					switchMap((user) => {
						if (!user) {
							// No user found in database
							// Lets create it

							// Before calling the callable function, refresh the token to get the right value for the 'email_verified' property
							return of(authUser.getIdToken(true)).pipe(
								switchMap(() => this.createUser().pipe(retry(5))),
								map((createdUser) => {
									return {
										authType: AuthType.Created,
										user: createdUser,
										authUser,
									};
								})
							);
						}
						return of({ authType: AuthType.LoggedIn, user, authUser });
					}),
					take(1),
					tap({
						next: (authResult) => {
							this.setState({ user: authResult.user }, 'USER_LOGGED_IN');
							window.localStorage.setItem('is-known', 'true');
						},
					})
				);
			}),
			take(1)
		);
	}

	sendConfirmationEmail() {
		return this.authCredential$.pipe(
			filter((authUser) => !!authUser),
			take(1),
			switchMap((authUser: FirebaseUser) =>
				from(
					authUser.sendEmailVerification({
						url: `${window.location.origin}/welcome`,
						handleCodeInApp: true,
					})
				)
			)
		);
	}
	isEmailVerified$(): Observable<boolean> {
		return this.authCredential$.pipe(
			filter((authUser) => !!authUser),
			take(1),
			map((authUser: FirebaseUser) => authUser.emailVerified)
		);
	}

	/**
	 * Log the user out and wait for the state to be propagated
	 */
	logout() {
		// Adding isAuthenticated$ in the mix to ensure subsequent uses can have a properly updated state
		return from(this.presenceService.setConnectionState('offline')).pipe(
			switchMap(() => combineLatest([from(this.auth.signOut()), this.isAuthenticated$])),
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
		return from(this.presenceService.setConnectionState('offline')).pipe(
			switchMap(() => {
				const callable = this.fns.httpsCallable('deleteUser');
				return callable({});
			})
		);
	}

	resetPassword(email?: string): Observable<void> {
		if (email) {
			return from(this.auth.sendPasswordResetEmail(email));
		}
		return this.authCredential$.pipe(
			first(),
			switchMap((cred) => {
				if (!cred?.email) {
					throw new Error('user_has_no_email');
				}
				return this.auth.sendPasswordResetEmail(cred.email);
			})
		);
	}
}
