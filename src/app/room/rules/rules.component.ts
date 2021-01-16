import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'mas-rules',
	templateUrl: './rules.component.html',
	styleUrls: ['./rules.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulesComponent {}
