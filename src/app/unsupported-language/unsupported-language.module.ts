import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UnsupportedLanguageComponent } from './unsupported-language.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';

@NgModule({
	declarations: [UnsupportedLanguageComponent],
	imports: [
		CommonModule,
		SharedModule,
		RouterModule.forChild([{ path: '', component: UnsupportedLanguageComponent }]),
	],
})
export class UnsupportedLanguageModule {}
