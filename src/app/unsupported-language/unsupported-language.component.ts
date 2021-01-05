import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'mas-unsupported-language',
	templateUrl: './unsupported-language.component.html',
	styleUrls: ['./unsupported-language.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnsupportedLanguageComponent {}
