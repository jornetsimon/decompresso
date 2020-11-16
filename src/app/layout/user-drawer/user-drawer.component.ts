import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { AuthService } from '@services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router } from '@angular/router';
import { LayoutService } from '../layout.service';
import { UserService } from '@services/user.service';

@Component({
	selector: 'mas-user-drawer',
	templateUrl: './user-drawer.component.html',
	styleUrls: ['./user-drawer.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDrawerComponent {
	@Input() visible: boolean;
	placement: NzDrawerPlacement = 'left';

	user$ = this.userService.user$;

	constructor(
		private authService: AuthService,
		private userService: UserService,
		public layoutService: LayoutService,
		private message: NzMessageService,
		private router: Router
	) {}

	logout() {
		this.authService.logout().subscribe({
			next: () => {
				this.router.navigateByUrl('/');
				this.message.success('Vous avez bien été déconnecté');
			},
		});
	}
}
