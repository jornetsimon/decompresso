import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UserService } from '@services/user.service';
import { RoomService } from '@services/room.service';
import { LayoutService } from '../../layout/layout.service';
import { TitleService } from '@services/title.service';
import { PushNotificationsService } from '@services/push-notifications.service';
import { EnhancementService } from '@services/enhancement.service';
import { PwaService } from '@services/pwa/pwa.service';
import { combineLatest, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
	selector: 'mas-room',
	templateUrl: './room.component.html',
	styleUrls: ['./room.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomComponent implements OnInit {
	dismissedPwaLabel = window.localStorage.getItem('dismiss-notifications-tag') === 'true';
	dismissedNotificationsLabel = window.localStorage.getItem('dismiss-pwa-tag') === 'true';
	showAddPwaButton$ = combineLatest([
		of(!!this.pwaService.deferredPrompt && !this.dismissedPwaLabel),
		this.enhancementService.userInstalledPwa$,
	]).pipe(map(([x, y]) => x && !y));

	constructor(
		public userService: UserService,
		public roomService: RoomService,
		public layoutService: LayoutService,
		private titleService: TitleService,
		private pwaService: PwaService,
		public pushNotificationsService: PushNotificationsService,
		public enhancementService: EnhancementService
	) {}

	ngOnInit() {
		this.titleService.setTitle('Salon');
	}

	installPwa() {
		this.enhancementService.installPwa().subscribe();
	}
	ignorePwa() {
		window.localStorage.setItem('dismiss-pwa-tag', 'true');
	}

	setupNotifications() {
		this.enhancementService.setupNotifications();
	}
	ignoreNotifications() {
		window.localStorage.setItem('dismiss-notifications-tag', 'true');
	}
}
