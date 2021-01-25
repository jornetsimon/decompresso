import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UserService } from '@services/user.service';
import { RoomService } from '@services/room.service';
import { LayoutService } from '../../layout/layout.service';
import { TitleService } from '@services/title.service';

@Component({
	selector: 'mas-room',
	templateUrl: './room.component.html',
	styleUrls: ['./room.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomComponent implements OnInit {
	constructor(
		public userService: UserService,
		public roomService: RoomService,
		public layoutService: LayoutService,
		private titleService: TitleService
	) {}

	ngOnInit() {
		this.titleService.setTitle('Salon');
	}
}
