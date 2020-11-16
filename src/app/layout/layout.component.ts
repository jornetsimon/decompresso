import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { LayoutService } from './layout.service';

@Component({
	selector: 'mas-layout',
	templateUrl: './layout.component.html',
	styleUrls: ['./layout.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
	now = Date.now();
	constructor(public authService: AuthService, public layoutService: LayoutService) {}
}
