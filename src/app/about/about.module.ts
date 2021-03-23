import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutComponent } from './about.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

@NgModule({
	declarations: [AboutComponent],
	imports: [
		CommonModule,
		SharedModule,
		RouterModule.forChild([{ path: '', component: AboutComponent }]),
	],
	providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'about' }],
})
export class AboutModule {}
