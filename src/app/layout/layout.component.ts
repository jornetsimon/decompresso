import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router } from '@angular/router';

@Component({
	selector: 'mas-layout',
	templateUrl: './layout.component.html',
	styleUrls: ['./layout.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
	now = Date.now();
	constructor(
		public authService: AuthService,
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
