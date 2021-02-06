import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '@services/auth.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Router } from '@angular/router';
import { UserService } from '@services/user.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { GLOBAL_CONFIG } from '../../global-config';
import { ErrorWithCode } from '@utilities/errors';
import { NzModalService } from 'ng-zorro-antd/modal';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, filter, map, mapTo } from 'rxjs/operators';
import { AnalyticsService } from '@analytics/analytics.service';
import { GaCategoryEnum } from '@analytics/ga-category.enum';
import { GaEventEnum } from '@analytics/ga-event.enum';

type Type = 'login' | 'signup';

@UntilDestroy()
@Component({
	selector: 'mas-signin',
	templateUrl: './signin.component.html',
	styleUrls: ['./signin.component.scss'],
})
export class SigninComponent implements OnInit {
	@ViewChild('currentPassword') currentPasswordInputRef: ElementRef<HTMLInputElement>;
	@ViewChild('newPassword') newPasswordInputRef: ElementRef<HTMLInputElement>;
	type: Type = 'signup';
	tabIndex = 0;
	loading: boolean;

	emailFc = new FormControl(undefined, [Validators.required]);
	loginFormGroup = new FormGroup({
		email: this.emailFc,
		password: new FormGroup(
			{
				signupPassword: new FormGroup(
					{
						password: new FormControl(undefined, [
							Validators.required,
							Validators.minLength(GLOBAL_CONFIG.auth.minPasswordLength),
						]),
						passwordConfirm: new FormControl(undefined, [Validators.required]),
					},
					{
						validators: [SigninComponent.passwordsMatchValidator],
					}
				),
				loginPassword: new FormControl(undefined, [
					Validators.minLength(GLOBAL_CONFIG.auth.minPasswordLength),
				]),
			},
			{
				validators: [SigninComponent.atLeastOneValidator],
			}
		),
	});

	showPasswordResetButton$: Observable<boolean> = this.emailFc.valueChanges.pipe(
		map((value) => this.emailFc.valid && value)
	);

	static passwordsMatchValidator: ValidatorFn = (group: FormGroup) => {
		const pass = group.get('password')?.value;
		const confirmPass = group.get('passwordConfirm')?.value;

		return pass === confirmPass ? null : { notSame: true };
	};
	static atLeastOneValidator = (controlGroup: FormGroup): ValidationErrors | null => {
		const controls = controlGroup.controls;
		if (controls) {
			const atLeastOneControlHasValue = Object.keys(controls).some(
				(key) => controls[key].value
			);
			if (!atLeastOneControlHasValue) {
				return {
					atLeastOneRequired: true,
				};
			}
		}
		return null;
	};

	constructor(
		public authService: AuthService,
		private userService: UserService,
		private router: Router,
		private message: NzMessageService,
		private modal: NzModalService,
		private analyticsService: AnalyticsService
	) {}

	ngOnInit() {
		if (window.localStorage.getItem('is-known') === 'true') {
			this.onTabChange(1, false);
		}

		const personalEmailEntered$ = this.emailFc?.statusChanges.pipe(
			filter(
				(status) => status === 'INVALID' && this.emailFc.getError('emailDomainIsPublic')
			),
			debounceTime(2000)
		);

		personalEmailEntered$.subscribe(() => {
			this.analyticsService.logEvent('personal_email', GaCategoryEnum.SIGN_UP);
		});
	}

	emailControlStatus(): 'success' | 'warning' | 'error' | 'validating' | '' {
		const control = this.loginFormGroup.get('email');
		if (!control || control.untouched || !control.value) {
			return '';
		}
		if (control.errors) {
			const errorCount = Object.keys(control.errors).length;
			if (errorCount === 1 && Object.keys(control.errors)[0] === 'pattern') {
				return 'warning';
			} else {
				return 'error';
			}
		}
		return 'success';
	}

	formSubmit() {
		this.loading = true;
		const formValues = this.loginFormGroup.value;
		const email = formValues.email;

		if (this.type === 'login') {
			const password: string = formValues.password.loginPassword;
			this.authService.loginWithEmailPassword(email, password).then(
				() => {
					this.modal.closeAll();
					this.router.navigateByUrl(`/welcome`);
				},
				(err: ErrorWithCode) => {
					this.loading = false;
					switch (err.code) {
						case 'auth/user-not-found':
							this.message.error('Cette adresse email nous est inconnue 🧐');
							break;
						case 'auth/wrong-password':
							this.message.error('Mot de passe incorrect');
							break;
						case 'auth/user-disabled':
							this.modal.error({
								nzTitle: 'Connexion refusée',
								nzContent:
									'Le compte associé à cette adresse email a été désactivé.',
								nzOkText: 'Compris',
							});
							break;
						default:
							this.message.error(
								'La connexion à votre compte a échoué, essayez de nouveau dans quelques minutes 🥲'
							);
					}
				}
			);
		} else {
			const password: string = formValues.password.signupPassword.password;
			this.authService.signupWithEmailPassword(email, password).then(
				() => {
					this.modal.closeAll();
					this.analyticsService.logEvent(GaEventEnum.SIGN_UP, GaCategoryEnum.SIGN_UP);
					this.router.navigateByUrl(`/welcome`);
				},
				(err: ErrorWithCode) => {
					this.loading = false;
					switch (err.code) {
						case 'auth/email-already-in-use':
							this.message.error(
								'Un compte existe déjà avec cette adresse email. Essayez plutôt de vous connecter 😉'
							);
							this.onTabChange(1);
							break;
						default:
							this.message.error(
								'Échec de la création du compte, nous en sommes désolés 😔'
							);
					}
				}
			);
		}
	}

	onTabChange(tabIndex: number, focusInput = true) {
		const type = tabIndex === 0 ? 'signup' : 'login';
		this.type = type;
		this.tabIndex = tabIndex;
		const passwordFg = this.loginFormGroup.get('password');
		const loginPasswordFg = passwordFg?.get('loginPassword');
		const signupPasswordFg = passwordFg?.get('signupPassword');
		switch (type) {
			case 'signup':
				if (focusInput) {
					this.newPasswordInputRef.nativeElement.focus();
				}

				loginPasswordFg?.disable();
				signupPasswordFg?.enable();
				const loginPassword = loginPasswordFg?.value;
				if (passwordFg && loginPassword) {
					passwordFg.get('signupPassword')?.patchValue({ password: loginPassword });
				}
				break;
			case 'login':
				if (focusInput) {
					this.currentPasswordInputRef.nativeElement.focus();
				}
				signupPasswordFg?.disable();
				loginPasswordFg?.enable();
				const signupPassword = signupPasswordFg?.get('password')?.value;
				if (passwordFg && signupPassword) {
					passwordFg.get('loginPassword')?.setValue(signupPassword);
				}
				break;
		}
	}

	resetPassword() {
		if (this.emailFc.invalid) {
			return;
		}
		this.authService
			.resetPassword(this.emailFc.value)
			.pipe(
				catchError((err) => of(true)),
				mapTo(true)
			)
			.subscribe(() => {
				this.modal.success({
					nzTitle: 'Email de réinitialisation de mot de passe envoyé',
					nzContent:
						'Vous pourrez modifier votre mot de passe en cliquant sur le lien que vous avez reçu par email sur votre boîte pro.',
					nzOkText: 'Fermer',
				});
			});
	}
}
