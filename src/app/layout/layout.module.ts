import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './layout.component';
import { SharedModule } from '../shared/shared.module';
import { UserDrawerComponent } from './user-drawer/user-drawer.component';
import { NzIconModule } from 'ng-zorro-antd/icon';
import {
	ApiTwoTone,
	AppstoreAddOutline,
	BellFill,
	ChromeFill,
	FrownOutline,
	HomeOutline,
	LockOutline,
	LogoutOutline,
	MailFill,
	MenuOutline,
	MessageOutline,
	QuestionCircleOutline,
	ReadOutline,
	StarOutline,
	StopOutline,
	UserOutline,
	WarningOutline,
} from '@ant-design/icons-angular/icons';
import { FooterComponent } from './footer/footer.component';
import { NotificationsManagementComponent } from './notifications-management/notifications-management.component';
import { NewsletterManagementComponent } from './newsletter-management/newsletter-management.component';

@NgModule({
	declarations: [
		LayoutComponent,
		UserDrawerComponent,
		FooterComponent,
		NotificationsManagementComponent,
		NewsletterManagementComponent,
	],
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
			BellFill,
			ChromeFill,
			MailFill,
			StarOutline,
		]),
	],
	exports: [FooterComponent],
})
export class LayoutModule {}
