import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AuthService, AuthType } from '@services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataService } from '@services/data.service';
import {
	delay,
	filter,
	finalize,
	map,
	retryWhen,
	share,
	switchMap,
	take,
	tap,
} from 'rxjs/operators';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ErrorWithCode } from '@utilities/errors';
import { of } from 'rxjs';

@UntilDestroy()
@Component({
	selector: 'mas-welcome',
	templateUrl: './welcome.component.html',
	styleUrls: ['./welcome.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeComponent {
	loginOrCreateAccount$ = this.authService.loginOrCreateAccount().pipe(
		untilDestroyed(this),
		switchMap((authResult) => {
			if (!authResult.authUser.emailVerified) {
				return this.authService.sendConfirmationEmail().pipe(map(() => authResult));
			}
			return of(authResult);
		}),
		tap({
			next: (authResult) => {
				switch (authResult.authType) {
					case AuthType.Created:
						/*this.message.success('Votre compte a bien été créé');*/
						break;
					case AuthType.LoggedIn:
						if (authResult.user) {
							this.message.success(`Connecté à ${authResult.user.domain}`);
						}
						break;
				}
			},
			error: async (err: ErrorWithCode) => {
				switch (err.code) {
					case 'auth/user-disabled':
						this.modal.error({
							nzTitle: 'Connexion refusée',
							nzContent: 'Le compte associé à cette adresse email a été désactivé.',
							nzOkText: 'Compris',
						});
						break;
					case 'auth/user-token-expired':
						this.message.error(
							'Le lien que vous venez de cliquer a expiré. Avez-vous bien cliqué sur le dernier reçu ?'
						);
						break;
				}
				switch (err.message) {
					case 'public_email_domain':
						this.modal.error({
							nzTitle: 'Votre adresse email est personnelle',
							nzContent:
								'Merci de vous authentifier avec votre adresse professionnelle.',
							nzOkText: 'Compris',
						});
						break;
					case 'email_not_verified':
						this.message.success(
							'Votre adresse est maintenant validée. Vous pouvez vous connecter 🙌'
						);
						break;
					default:
						this.message.error('Authentification échouée');
				}
				await this.authService.logout().toPromise();
				await this.router.navigateByUrl('/');
			},
		}),
		share()
	);

	isEmailVerified$ = this.authService.isEmailVerified$().pipe(
		map((isVerified) => {
			if (!isVerified) {
				throw new Error('not_verified');
			} else {
				return isVerified;
			}
		}),
		retryWhen((errors) => errors.pipe(delay(5000), take(12))),
		share()
	);

	nicknames$ = this.authService.nicknamesSample();
	showNicknames: boolean;
	selectedNickname?: string;
	loadingNickname: string | null = null;

	constructor(
		private authService: AuthService,
		private dataService: DataService,
		private message: NzMessageService,
		private modal: NzModalService,
		private router: Router,
		private cd: ChangeDetectorRef
	) {
		// Redirect to room if the user was simply logged in
		this.loginOrCreateAccount$
			.pipe(filter((authResult) => authResult.authType === AuthType.LoggedIn))
			.subscribe((authResult) => {
				if (authResult.authUser.emailVerified && authResult.user) {
					this.router.navigateByUrl(`/room/${authResult.user.domain}`);
				}
			});
	}

	domainFromEmail(email: string) {
		const split = email.split('@');
		if (!split.length) {
			return '';
		}
		return split[split.length - 1];
	}

	selectNickname(nickname: string) {
		this.loadingNickname = nickname;
		this.authService
			.changeNickname(nickname)
			.pipe(
				finalize(() => {
					this.loadingNickname = null;
					this.cd.detectChanges();
				})
			)
			.subscribe(
				() => {
					this.selectedNickname = nickname;
					this.cd.detectChanges();
				},
				(error) => {
					if (error.message === 'nickname_unavailable') {
						this.message.error(
							`Désolé, ce pseudo vient d'être choisi à l'instant par un collègue. 😮<br/> Merci d'en choisir un autre.`
						);
					} else {
						this.message.error(
							`Le changement de pseudo a échoué. <br/>Vous pouvez contacter notre support : <a href="mailto:support@decompresso.fr">support@decompresso.fr</a>.`
						);
					}
				}
			);
	}
}
