import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CguComponent } from './cgu.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';

@NgModule({
	declarations: [CguComponent],
	imports: [
		CommonModule,
		RouterModule.forChild([{ path: '', component: CguComponent }]),
		SharedModule,
	],
})
export class CguModule {}
