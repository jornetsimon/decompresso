import { Component, TrackByFunction } from '@angular/core';
import { User } from '@model/user';
import { UserService } from '@services/user.service';
import { RoomService } from '@services/room.service';

@Component({
	selector: 'mas-members',
	templateUrl: './members.component.html',
	styleUrls: ['./members.component.scss'],
})
export class MembersComponent {
	trackByMemberFn: TrackByFunction<User> = (index, item) => item.nickname;
	constructor(public userService: UserService, public roomService: RoomService) {}
}
