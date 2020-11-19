import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat.component';
import { SharedModule } from '../../shared/shared.module';
import { NzIconModule } from 'ng-zorro-antd/icon';

@NgModule({
	declarations: [ChatComponent],
	imports: [CommonModule, SharedModule, NzIconModule.forChild([])],
	exports: [ChatComponent],
})
export class ChatModule {}
