import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutComponent } from './about.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

@NgModule({
	declarations: [AboutComponent],
	imports: [
		CommonModule,
		SharedModule,
		RouterModule.forChild([{ path: '', component: AboutComponent }]),
	],
})
export class AboutModule {}
