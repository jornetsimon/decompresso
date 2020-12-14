import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'mas-admin',
	templateUrl: './admin.component.html',
	styleUrls: ['./admin.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
	constructor() {}
}
