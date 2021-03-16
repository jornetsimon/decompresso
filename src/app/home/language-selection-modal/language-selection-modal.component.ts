import { ChangeDetectionStrategy, Component } from '@angular/core';
import { map } from 'rxjs/operators';
import { LanguageService } from '../../transloco/language.service';

@Component({
	selector: 'mas-language-selection-modal',
	templateUrl: './language-selection-modal.component.html',
	styleUrls: ['./language-selection-modal.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelectionModalComponent {
	showLanguageSelectionModal$ = this.languageService.initialLanguageSelected$.pipe(
		map((languageSelected) => !languageSelected)
	);
	constructor(private languageService: LanguageService) {}

	selectLanguage(lang: 'fr' | 'fun') {
		this.languageService.setLanguage(lang, true);
	}
}
