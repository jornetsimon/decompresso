import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpComponent } from './help.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule, Routes } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import {
	CloseCircleTwoTone,
	ExclamationCircleTwoTone,
	SafetyCertificateOutline,
} from '@ant-design/icons-angular/icons';
import { TRANSLOCO_SCOPE } from '@ngneat/transloco';

const helpRoutes: Routes = [
	{
		path: '',
		component: HelpComponent,
	},
];

@NgModule({
	declarations: [HelpComponent],
	imports: [
		CommonModule,
		SharedModule,
		RouterModule.forChild(helpRoutes),
		NzIconModule.forChild([
			ExclamationCircleTwoTone,
			CloseCircleTwoTone,
			SafetyCertificateOutline,
		]),
	],
	providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'help' }],
})
export class HelpModule {}
