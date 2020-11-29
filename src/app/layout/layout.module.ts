import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './layout.component';
import { SharedModule } from '../shared/shared.module';
import { UserDrawerComponent } from './user-drawer/user-drawer.component';
import { NzIconModule } from 'ng-zorro-antd/icon';
import {
	HomeOutline,
	LogoutOutline,
	MenuOutline,
	MessageOutline,
	QuestionCircleOutline,
	SettingOutline,
	UserOutline,
	WarningOutline,
} from '@ant-design/icons-angular/icons';

@NgModule({
	declarations: [LayoutComponent, UserDrawerComponent],
	imports: [
		CommonModule,
		SharedModule,
		NzIconModule.forChild([
			MenuOutline,
			LogoutOutline,
			WarningOutline,
			UserOutline,
			QuestionCircleOutline,
			MessageOutline,
			HomeOutline,
			SettingOutline,
		]),
	],
})
export class LayoutModule {}
