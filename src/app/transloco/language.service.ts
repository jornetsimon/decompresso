import { Injectable } from '@angular/core';
import { TranslocoService } from '@ngneat/transloco';
import { StorageMap } from '@ngx-pwa/local-storage';
import { Observable } from 'rxjs';
import { first, map, takeWhile } from 'rxjs/operators';

export type Language = 'fr' | 'fun';

@Injectable({
	providedIn: 'root',
})
export class LanguageService {
	private defaultLang = 'fr';
	/**
	 * The language currently stored
	 */
	lang$ = this.storage.watch('lang') as Observable<Language | undefined>;
	/**
	 * Determines if a language has already been set
	 */
	initialLanguageSelected$ = this.lang$.pipe(
		map((lang) => lang !== undefined),
		takeWhile((selected) => !selected, true)
	);
	constructor(private translocoService: TranslocoService, private storage: StorageMap) {
		this.lang$.subscribe((lang) => {
			const newLang = lang ?? this.defaultLang;
			if (this.translocoService.getActiveLang() !== newLang) {
				// Apply the new language on change
				this.translocoService.setActiveLang(lang ?? this.defaultLang);
			}
		});
	}

	setLanguage(lang: 'fr' | 'fun') {
		this.storage.set('lang', lang).subscribe();
	}

	/**
	 * Switch from one language to the other
	 */
	toggleLanguage() {
		this.lang$
			.pipe(first())
			.subscribe((currentLang) => this.setLanguage(currentLang === 'fun' ? 'fr' : 'fun'));
	}
}
