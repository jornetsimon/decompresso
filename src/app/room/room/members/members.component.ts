import {
	ChangeDetectionStrategy,
	Component,
	TemplateRef,
	TrackByFunction,
	ViewChild,
} from '@angular/core';
import { User } from '@model/user';
import { UserService } from '@services/user.service';
import { RoomService } from '@services/room.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { InvitationsComponent } from '../../invitations/invitations.component';
import { RulesComponent } from '../../rules/rules.component';

@Component({
	selector: 'mas-members',
	templateUrl: './members.component.html',
	styleUrls: ['./members.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersComponent {
	tooltipConfig = {
		color: 'gold',
	};
	@ViewChild('deleteAccountTooltip') deleteAccountTooltip: TemplateRef<void>;
	trackByMemberFn: TrackByFunction<User> = (index, item) => item.nickname;
	constructor(
		public userService: UserService,
		public roomService: RoomService,
		private modalService: NzModalService
	) {}

	memberTooltip(member: User): string | TemplateRef<void> | null {
		if (member.deleted) {
			return this.deleteAccountTooltip;
		}
		return null;
	}

	openInvitationsModal() {
		this.modalService.create({
			nzTitle: 'Inviter des collègues',
			nzContent: InvitationsComponent,
			nzOkType: 'default',
			nzOkText: 'Fermer',
			nzCancelText: null,
		});
	}

	openRulesModal() {
		this.modalService.create({
			nzTitle: undefined,
			nzContent: RulesComponent,
			nzOkText: null,
			nzCancelText: 'Fermer',
		});
	}
}
