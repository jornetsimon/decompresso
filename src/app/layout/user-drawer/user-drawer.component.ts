import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { AuthService } from '@services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router } from '@angular/router';
import { UserService } from '@services/user.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { finalize, switchMap, tap } from 'rxjs/operators';

@Component({
	selector: 'mas-user-drawer',
	templateUrl: './user-drawer.component.html',
	styleUrls: ['./user-drawer.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDrawerComponent {
	@Input() visible: boolean;
	@Output() closed = new EventEmitter<void>();
	placement: NzDrawerPlacement = 'left';

	user$ = this.userService.user$;

	constructor(
		private authService: AuthService,
		private userService: UserService,
		private message: NzMessageService,
		private modalService: NzModalService,
		private router: Router
	) {}

	closeDrawer() {
		this.closed.emit();
		this.visible = false;
	}

	logout() {
		this.authService.logout().subscribe({
			next: () => {
				this.router.navigateByUrl('/');
				this.message.success('Vous avez bien été déconnecté');
			},
		});
	}
	deleteAccount() {
		let deletionLoading = false;
		const modal = this.modalService.confirm({
			nzTitle: 'Suppression de compte',
			nzContent: `<b>Êtes-vous certain de vouloir supprimer définitivement votre compte ?</b>`,
			nzClassName: 'delete-account-modal',
			nzOkText: 'Supprimer mon compte',
			nzOkType: 'danger',
			nzIconType: 'warning',
			nzCancelText: 'Non, je reste 😌',
			nzOkLoading: deletionLoading,
			nzOnOk: () => {
				deletionLoading = true;
				return this.authService
					.deleteUser()
					.pipe(
						tap({
							next: () => {
								modal.close();
							},
						}),
						switchMap(() => this.authService.logout()),
						switchMap(() => this.router.navigateByUrl('/')),
						finalize(() => {
							deletionLoading = true;
						}),
						tap({
							next: () => {
								this.modalService.success({
									nzTitle: 'Votre compte a bien été supprimé',
									nzContent: 'Nous vous souhaitons une belle continuation 👋',
									nzOkText: "Revenir à l'accueil",
								});
							},
							error: (err) => {
								console.error(err);
								this.message.error(
									'Une erreur est survenue lors de la suppression de votre compte.<br/>Merci de contacter notre support : <a href="mailto:support@mascarade.chat">support@mascarade.chat</a>.',
									{
										nzDuration: 20000,
									}
								);
							},
						})
					)
					.toPromise();
			},
		});
	}
}
