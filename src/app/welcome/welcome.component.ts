import { Component } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DataService } from '../shared/services/data.service';

@UntilDestroy()
@Component({
	selector: 'mas-welcome',
	templateUrl: './welcome.component.html',
	styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent {
	constructor(
		public authService: AuthService,
		private dataService: DataService,
		private message: NzMessageService
	) {
		this.authService.loginOrCreateAccount().subscribe({
			next: (user) => {
				console.log(user);
				this.message.success('Connecté');
			},
		});
	}
}
