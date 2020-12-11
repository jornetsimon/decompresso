import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat.component';
import { SharedModule } from '../../shared/shared.module';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MessageGroupComponent } from './message-group/message-group.component';
import { MessageComponent } from './message-group/message/message.component';
import { MessageFormComponent } from './message-form/message-form.component';
import { NzMentionModule } from 'ng-zorro-antd/mention';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { LastReadMessageComponent } from './last-read-message/last-read-message.component';
import { SystemComponent } from './system/system.component';
import { PurgeNotificationComponent } from './purge-notification/purge-notification.component';
import { ReportComponent } from './report/report.component';

@NgModule({
	declarations: [
		ChatComponent,
		MessageGroupComponent,
		MessageComponent,
		MessageFormComponent,
		LastReadMessageComponent,
		SystemComponent,
		PurgeNotificationComponent,
		ReportComponent,
	],
	imports: [CommonModule, SharedModule, NzIconModule.forChild([]), NzMentionModule, PickerModule],
	exports: [ChatComponent],
})
export class ChatModule {}
