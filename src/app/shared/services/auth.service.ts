import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireFunctions } from '@angular/fire/functions';
import { AngularFireAuth } from '@angular/fire/auth';
import { from, Observable, of } from 'rxjs';
import { User as FirebaseUser } from 'firebase/app';
import { ObservableStore } from '@codewithdan/observable-store';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Serialized } from '../utilities/data-transfer-object';
import { serialize } from '../utilities/serialize';
import { User } from '../model/user';
import { DataService } from './data.service';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';

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
		private auth: AngularFireAuth,
		private router: Router,
		private nzModalService: NzModalService,
		private message: NzMessageService,
		private dataService: DataService
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

	/**
	 * Send an email to log in
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
	 * Log user in or create their account in database
	 */
	loginOrCreateAccount(): Observable<User> {
		return this.isAuthenticated$.pipe(
			take(1),
			switchMap((isAuthenticated) => {
				if (isAuthenticated) {
					return this.authUser$;
				} else {
					return this.signInFromEmailLink().pipe(
						tap({
							error: async (err) => {
								if (err.code === 'auth/user-disabled') {
									await this.logout().toPromise();
									this.message.error('Cette adresse email a été refusée');
								} else {
									this.message.error('Authentification échouée');
								}
								this.router.navigateByUrl('/');
							},
						}),
						map((credential: firebase.auth.UserCredential) => credential.user)
					);
				}
			}),
			switchMap((authUser: firebase.User | null) => {
				if (!authUser) {
					throw new Error('missing_auth_user');
				}
				return this.dataService.user$(authUser.uid).pipe(
					take(1),
					switchMap((user) => {
						if (!user) {
							// No user found in database
							return this.createUser().pipe(
								tap({
									next: () => {
										this.message.success('Votre compte a bien été créé');
									},
									error: async (err: Error) => {
										await this.logout().toPromise();
										await this.router.navigateByUrl('/');
										if (err.message === 'public_email_domain') {
											this.nzModalService.error({
												nzTitle: 'Votre adresse email est personnelle',
												nzContent:
													'Merci de vous connecter avec votre adresse professionnelle',
												nzOkText: 'Compris',
											});
										}
									},
								})
							);
						}
						return of(user);
					})
				);
			}),
			take(1)
		);
	}

	logout() {
		return from(this.auth.signOut());
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
