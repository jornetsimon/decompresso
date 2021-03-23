import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { LanguageService } from './language.service';
import { combineLatest, Subject } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Directive({
	selector: '[ifLang]',
})
export class IfLangDirective {
	private readonly ngIfDirective: NgIf;
	@Input() set ifLang(inputLang: string) {
		this.inputLangSub.next(inputLang);
	}

	inputLangSub = new Subject<string>();

	constructor(
		private languageService: LanguageService,
		private templateRef: TemplateRef<any>,
		private viewContainer: ViewContainerRef
	) {
		if (!this.ngIfDirective) {
			this.ngIfDirective = new NgIf(this.viewContainer, this.templateRef);
		}

		combineLatest([this.inputLangSub.asObservable(), this.languageService.lang$])
			.pipe(untilDestroyed(this))
			.subscribe(([inputLang, currentLang]) => {
				this.ngIfDirective.ngIf = inputLang === currentLang;
			});
	}
}
