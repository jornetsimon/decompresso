import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './layout.component';
import { SharedModule } from '../shared/shared.module';
import { UserDrawerComponent } from './user-drawer/user-drawer.component';
import { NzIconModule } from 'ng-zorro-antd/icon';
import {
	ApiTwoTone,
	AppstoreAddOutline,
	FrownOutline,
	HomeOutline,
	LockOutline,
	LogoutOutline,
	MenuOutline,
	MessageOutline,
	QuestionCircleOutline,
	ReadOutline,
	StopOutline,
	UserOutline,
	WarningOutline,
} from '@ant-design/icons-angular/icons';
import { FooterComponent } from './footer/footer.component';

@NgModule({
	declarations: [LayoutComponent, UserDrawerComponent, FooterComponent],
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
			ApiTwoTone,
			LockOutline,
			FrownOutline,
			ReadOutline,
			AppstoreAddOutline,
			StopOutline,
		]),
	],
	exports: [FooterComponent],
})
export class LayoutModule {}
