import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PublicityComponent } from './publicity.component';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { SharedModule } from '../shared/shared.module';

@NgModule({
	declarations: [PublicityComponent],
	imports: [
		CommonModule,
		RouterModule.forChild([{ path: '', component: PublicityComponent }]),
		SharedModule,
		NzCarouselModule,
	],
})
export class PublicityModule {}
