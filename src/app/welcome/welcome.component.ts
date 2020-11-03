import { Component, OnInit } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { Router } from '@angular/router';

@Component({
	selector: 'mas-welcome',
	templateUrl: './welcome.component.html',
	styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent implements OnInit {
	constructor(
		public authService: AuthService,
		private message: NzMessageService,
		private router: Router
	) {}

	ngOnInit(): void {
		this.authService.signInFromEmailLink().subscribe({
			next: (data) => {
				this.message.success('Connecté !');
			},
			error: (err) => {
				console.error(err);
				this.router.navigateByUrl('/');
			},
		});
	}
}
