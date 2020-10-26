import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

@Component({
	selector: 'mas-layout',
	templateUrl: './layout.component.html',
	styleUrls: ['./layout.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit {
	constructor() {}

	ngOnInit(): void {}
}
