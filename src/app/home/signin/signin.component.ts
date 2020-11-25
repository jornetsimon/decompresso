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

	loginFormGroup = new FormGroup({
		email: new FormControl(undefined, [Validators.required]),
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
		private modal: NzModalService
	) {}

	ngOnInit() {
		if (window.localStorage.getItem('is-known') === 'true') {
			this.onTabChange(1, false);
		}
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
}
