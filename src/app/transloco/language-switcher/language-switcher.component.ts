import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { LanguageService } from '../language.service';

@UntilDestroy()
@Component({
	selector: 'mas-language-switcher',
	templateUrl: './language-switcher.component.html',
	styleUrls: ['./language-switcher.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
	control = new FormControl(false, [Validators.required]);
	constructor(private languageService: LanguageService) {
		this.control.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
			const lang = value === true ? 'fun' : 'fr';
			this.languageService.setLanguage(lang);
		});
	}

	toggle() {
		this.control.setValue(!this.control.value);
	}
}
