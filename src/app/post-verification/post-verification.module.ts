import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { PostVerificationComponent } from './post-verification.component';
import { NzIconModule } from 'ng-zorro-antd/icon';

@NgModule({
	declarations: [PostVerificationComponent],
	imports: [
		CommonModule,
		RouterModule.forChild([{ path: '', component: PostVerificationComponent }]),
		SharedModule,
		NzIconModule.forChild([]),
	],
})
export class PostVerificationModule {}
