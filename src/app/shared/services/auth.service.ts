import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AngularFireAuth } from '@angular/fire/auth';
import { from, Observable, of } from 'rxjs';
import { ObservableStore } from '@codewithdan/observable-store';
import {
	catchError,
	delay,
	distinctUntilChanged,
	first,
	map,
	retryWhen,
	switchMap,
	take,
	tap,
} from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Serialized } from '@utilities/data-transfer-object';
import { serialize } from '@utilities/serialize';
import { User } from '@model/user';
import { DataService } from './data.service';
import firebase from 'firebase';
import { ErrorWithCode } from '@utilities/errors';

type FirebaseUser = firebase.User;
type FirebaseUserCredential = firebase.auth.UserCredential;

interface StoreState {
	auth_credential: Serialized<FirebaseUser> | null | undefined;
	user: User | null;
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
	authChecked$ = this.globalStateChanged.pipe(
		map((state) => state.auth_credential !== undefined)
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
		map((state: StoreState) => state.user),
		distinctUntilChanged()
	);

	constructor(
		private fns: AngularFireFunctions,
		private auth: AngularFireAuth,
		private dataService: DataService
	) {
		super({});

		// Initialize auth state
		this.setState({ auth_credential: undefined, user: null }, 'INIT_AUTH_STATE');

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

	/**
	 * Send an email to a user to log in with magic link
	 */
	sendSignInLink(
		email: string
	): Observable<{
		status: string;
		message?: string;
	}> {
		const afterLoginRoute = 'welcome';
		return from(
			this.auth.sendSignInLinkToEmail(email, {
				url: `${window.location.href}/${afterLoginRoute}`,
				handleCodeInApp: true,
			})
		).pipe(
			map(() => {
				return { status: 'sent' };
			}),
			catchError((err: ErrorWithCode) => {
				return of({ status: 'error', message: err.code });
			}),
			tap({
				next: () => {
					window.localStorage.setItem('emailForSignIn', email);
				},
			})
		);
	}

	/**
	 * Log user in or create their account in database
	 */
	loginOrCreateAccount(): Observable<{ authType: AuthType; user: User }> {
		return this.isAuthenticated$.pipe(
			take(1),
			switchMap((isAuthenticated) => {
				if (isAuthenticated) {
					return this.authCredential$;
				} else {
					return this.signInFromEmailLink().pipe(
						map((credential: FirebaseUserCredential) => credential.user)
					);
				}
			}),
			switchMap((authUser: FirebaseUser | null) => {
				if (!authUser) {
					throw new Error('missing_auth_user');
				}
				return this.dataService.user$(authUser.uid).pipe(
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
				);
			}),
			take(1),
			tap({
				next: (authResult) => {
					this.setState({ user: authResult.user }, 'USER_LOGGED_IN');
				},
			})
		);
	}

	/**
	 * Log the user out
	 */
	logout() {
		return from(this.auth.signOut());
	}

	/**
	 * Authenticates the user with the magic link
	 */
	private signInFromEmailLink() {
		return from(this.auth.isSignInWithEmailLink(window.location.href)).pipe(
			switchMap((isSignInWithEmailLink) => {
				// Confirm the link is a sign-in with email link.
				if (isSignInWithEmailLink) {
					// Additional state parameters can also be passed via URL.
					// This can be used to continue the user's intended action before triggering
					// the sign-in operation.
					// Get the email if available. This should be available if the user completes
					// the flow on the same device where they started it.
					let email = window.localStorage.getItem('emailForSignIn') as string;
					if (!email) {
						// User opened the link on a different device. To prevent session fixation
						// attacks, ask the user to provide the associated email again. For example:
						const confirmEmail = window.prompt('Merci de confirmer votre email');
						if (!confirmEmail) {
							throw new Error(`L'adresse email ne correspond pas au lien cliqué.`);
						} else {
							email = confirmEmail;
						}
					}
					// The client SDK will parse the code from the link for you.
					return from(this.auth.signInWithEmailLink(email, window.location.href));
				} else {
					throw new Error('sign_in_with_email_link_failed');
				}
			})
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
}
