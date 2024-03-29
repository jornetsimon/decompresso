import {
	ChangeDetectionStrategy,
	Component,
	EventEmitter,
	Input,
	Output,
	TemplateRef,
	ViewChild,
} from '@angular/core';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { AuthService } from '@services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router } from '@angular/router';
import { UserService } from '@services/user.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { AnalyticsService } from '@analytics/analytics.service';
import { PwaService } from '@services/pwa/pwa.service';
import { PushNotificationsService } from '@services/push-notifications.service';
import { DeviceDetectorService } from 'ngx-device-detector';
import { EnhancementService } from '@services/enhancement.service';

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

	@ViewChild('disabledNotificationsWarningTpl')
	disabledNotificationsWarningTpl: TemplateRef<void>;

	user$ = this.userService.user$;
	showAddPwaButton = !!this.pwaService.deferredPrompt;
	notificationDrawerVisible: boolean;
	newsletterDrawerVisible: boolean;

	isMobile = this.deviceDetectorService.isMobile();

	constructor(
		private authService: AuthService,
		private userService: UserService,
		private message: NzMessageService,
		private modalService: NzModalService,
		private router: Router,
		private analyticsService: AnalyticsService,
		private pwaService: PwaService,
		public pushNotificationsService: PushNotificationsService,
		private deviceDetectorService: DeviceDetectorService,
		public enhancementService: EnhancementService
	) {}

	closeDrawer() {
		this.closed.emit();
		this.visible = false;
	}

	logout() {
		this.closeDrawer();
		this.analyticsService.logEvent('logout', 'account');
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
				this.analyticsService.logEvent('delete_account', 'account');
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
								window.localStorage.removeItem('is-known');
								this.modalService.success({
									nzTitle: 'Votre compte a bien été supprimé',
									nzContent: 'Nous vous souhaitons une belle continuation 👋',
									nzOkText: "Revenir à l'accueil",
								});
							},
							error: (err) => {
								console.error(err);
								this.message.error(
									'Une erreur est survenue lors de la suppression de votre compte.<br/>Merci de contacter notre support : <a href="mailto:support@decompresso.fr">support@decompresso.fr</a>.',
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

	resetPassword() {
		let resetPasswordLoading = false;
		const modal = this.modalService.confirm({
			nzTitle: 'Modification de mot de passe',
			nzContent: `Nous pouvons vous envoyer un email pour modifier votre mot de passe.`,
			nzClassName: 'reset-password-modal',
			nzOkText: 'Réinitialiser mon mot de passe',
			nzOkType: 'primary',
			nzIconType: 'mail',
			nzCancelText: 'Annuler',
			nzOkLoading: resetPasswordLoading,
			nzOnOk: () => {
				resetPasswordLoading = true;
				return this.authService
					.resetPassword()
					.pipe(
						tap({
							next: () => {
								modal.close();
							},
						}),
						finalize(() => {
							resetPasswordLoading = true;
						}),
						tap({
							next: () => {
								this.modalService.success({
									nzTitle: 'Email envoyé',
									nzContent:
										'Vous pourrez modifier votre mot de passe en cliquant sur le lien que vous avez reçu par email sur votre boîte pro.',
									nzOkText: 'Fermer',
								});
							},
							error: (err) => {
								console.error(err);
								this.message.error(
									'Une erreur est survenue.<br/>Merci de contacter notre support : <a href="mailto:support@decompresso.fr">support@decompresso.fr</a>.',
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

	installPwa() {
		this.enhancementService.installPwa().subscribe();
	}
	setupNotifications() {
		this.enhancementService.setupNotifications(this.disabledNotificationsWarningTpl);
	}
}
