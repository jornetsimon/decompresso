import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService, AuthType } from '../shared/services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataService } from '../shared/services/data.service';
import { filter, share, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ErrorWithCode } from '../shared/utilities/errors';

@UntilDestroy()
@Component({
	selector: 'mas-welcome',
	templateUrl: './welcome.component.html',
	styleUrls: ['./welcome.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeComponent {
	$loginOrCreateAccount = this.authService.loginOrCreateAccount().pipe(
		untilDestroyed(this),
		tap({
			next: (authResult) => {
				switch (authResult.authType) {
					case AuthType.Created:
						/*this.message.success('Votre compte a bien été créé');*/
						break;
					case AuthType.LoggedIn:
						this.message.success('Connecté');
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
				}
				switch (err.message) {
					case 'public_email_domain':
						this.modal.error({
							nzTitle: 'Votre adresse email est personnelle',
							nzContent:
								'Merci de vous connecter avec votre adresse professionnelle.',
							nzOkText: 'Compris',
						});
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

	constructor(
		private authService: AuthService,
		private dataService: DataService,
		private message: NzMessageService,
		private modal: NzModalService,
		private router: Router
	) {
		// Redirect to room if the user was simply logged in
		this.$loginOrCreateAccount
			.pipe(filter((authResult) => authResult.authType === AuthType.LoggedIn))
			.subscribe((authResult) => {
				// TODO: redirect to room
				this.router.navigateByUrl(`/room/${authResult.user.domain}`);
			});
	}
}
