import { Component } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { LayoutService } from '../layout.service';
import { Router } from '@angular/router';

@Component({
	selector: 'mas-footer',
	templateUrl: './footer.component.html',
	styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
	now = Date.now();
	constructor(
		public authService: AuthService,
		public layoutService: LayoutService,
		public router: Router
	) {}
}
