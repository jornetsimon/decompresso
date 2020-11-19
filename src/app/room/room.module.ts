import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { RoomComponent } from './room/room.component';
import { RoomGuard } from './room.guard';
import { SharedModule } from '../shared/shared.module';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { QuestionCircleFill, SendOutline, SmileTwoTone } from '@ant-design/icons-angular/icons';
import { MembersComponent } from './room/members/members.component';
import { ChatModule } from './chat/chat.module';

const roomRoutes: Routes = [
	{
		path: ':domain',
		component: RoomComponent,
		canActivate: [RoomGuard],
	},
	{ path: '**', redirectTo: '/' },
];

@NgModule({
	declarations: [RoomComponent, MembersComponent],
	imports: [
		CommonModule,
		SharedModule,
		RouterModule.forChild(roomRoutes),
		NzIconModule.forChild([SmileTwoTone, QuestionCircleFill, SendOutline]),
		ChatModule,
	],
})
export class RoomModule {}
