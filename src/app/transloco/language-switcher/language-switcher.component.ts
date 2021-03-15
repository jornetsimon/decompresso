import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { LanguageService } from '../language.service';

@UntilDestroy()
@Component({
	selector: 'mas-language-switcher',
	templateUrl: './language-switcher.component.html',
	styleUrls: ['./language-switcher.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
	state = this.languageService.lang$;
	constructor(private languageService: LanguageService) {}

	toggle() {
		this.languageService.toggleLanguage();
	}
}
