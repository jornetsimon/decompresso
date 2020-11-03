import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AngularFireAuth } from '@angular/fire/auth';
import { from, Observable, of } from 'rxjs';
import { User as FirebaseUser } from 'firebase/app';
import { ObservableStore } from '@codewithdan/observable-store';
import { catchError, map, tap } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Serialized } from '../utilities/data-transfer-object';
import { serialize } from '../utilities/serialize';

interface StoreState {
	auth_email: string;
	auth_user: Serialized<FirebaseUser> | null | undefined;
}

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class AuthService extends ObservableStore<StoreState> {
	/**
	 * Has the authentication been checked?
	 */
	authChecked$ = this.globalStateChanged.pipe(map((state) => state.auth_user !== undefined));
	authUser$: Observable<FirebaseUser | null> = this.auth.user;
	isAuthenticated$: Observable<boolean> = this.auth.user.pipe(map((user) => !!user));

	constructor(
		private afs: AngularFirestore,
		private fns: AngularFireFunctions,
		private auth: AngularFireAuth
	) {
		super({});

		// Initialize auth state
		this.setState({ auth_user: undefined }, 'INIT_AUTH_STATE');

		this.auth.authState
			.pipe(
				tap((auth_credential) => {
					this.setState(
						{ auth_user: serialize(auth_credential) },
						'AUTH_CREDENTIAL_CHANGE'
					);
				}),
				untilDestroyed(this)
			)
			.subscribe();
	}

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
			catchError((err) => {
				console.error(err);
				return of({ status: 'error', message: err.message });
			}),
			tap({
				next: () => {
					window.localStorage.setItem('emailForSignIn', email);
				},
			})
		);
	}

	signInFromEmailLink() {
		return from(this.auth.isSignInWithEmailLink(window.location.href)).pipe(
			map((isSignInWithEmailLink) => {
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

	logout() {
		return from(this.auth.signOut());
	}
}
