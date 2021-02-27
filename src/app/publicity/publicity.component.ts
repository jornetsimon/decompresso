import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'mas-publicity',
	templateUrl: './publicity.component.html',
	styleUrls: ['./publicity.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicityComponent {
	constructor() {}
}
