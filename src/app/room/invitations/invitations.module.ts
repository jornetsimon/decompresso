import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvitationsComponent } from './invitations.component';
import { InviteComponent } from './invite/invite.component';
import { SharedModule } from '../../shared/shared.module';
import { NzIconModule } from 'ng-zorro-antd/icon';

@NgModule({
	declarations: [InvitationsComponent, InviteComponent],
	imports: [CommonModule, SharedModule, NzIconModule.forChild([])],
	exports: [InvitationsComponent, InviteComponent],
})
export class InvitationsModule {}
