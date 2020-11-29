import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsComponent } from './settings.component';
import { RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { SharedModule } from '../shared/shared.module';

@NgModule({
	declarations: [SettingsComponent],
	imports: [
		CommonModule,
		RouterModule.forChild([{ path: '', component: SettingsComponent }]),
		NzIconModule.forChild([]),
		SharedModule,
	],
})
export class SettingsModule {}
