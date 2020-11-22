import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat.component';
import { SharedModule } from '../../shared/shared.module';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MessageGroupComponent } from './message-group/message-group.component';
import { MessageComponent } from './message-group/message/message.component';

@NgModule({
	declarations: [ChatComponent, MessageGroupComponent, MessageComponent],
	imports: [CommonModule, SharedModule, NzIconModule.forChild([])],
	exports: [ChatComponent],
})
export class ChatModule {}
