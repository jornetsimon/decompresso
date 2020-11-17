import { Component, TemplateRef, TrackByFunction, ViewChild } from '@angular/core';
import { User } from '@model/user';
import { UserService } from '@services/user.service';
import { RoomService } from '@services/room.service';

@Component({
	selector: 'mas-members',
	templateUrl: './members.component.html',
	styleUrls: ['./members.component.scss'],
})
export class MembersComponent {
	tooltipConfig = {
		color: 'gold',
	};
	@ViewChild('deleteAccountTooltip') deleteAccountTooltip: TemplateRef<void>;
	trackByMemberFn: TrackByFunction<User> = (index, item) => item.nickname;
	constructor(public userService: UserService, public roomService: RoomService) {}

	memberTooltip(member: User): string | TemplateRef<void> | null {
		if (member.deleted) {
			return this.deleteAccountTooltip;
		}
		return null;
	}
}
