import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UserService } from '@services/user.service';
import { RoomService } from '@services/room.service';

@Component({
	selector: 'mas-room',
	templateUrl: './room.component.html',
	styleUrls: ['./room.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomComponent {
	constructor(public userService: UserService, public roomService: RoomService) {}
}
