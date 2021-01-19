import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RoomService } from '@services/room.service';
import { distinctUntilChanged, first, map, scan, shareReplay, startWith } from 'rxjs/operators';
import { combineLatest, Observable, Subject } from 'rxjs';

@Component({
	selector: 'mas-invitations',
	templateUrl: './invitations.component.html',
	styleUrls: ['./invitations.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitationsComponent {
	@Input() isFirstUser: boolean;
	private readonly maxInvitesDisplayed = 3;
	room$ = this.roomService.room$.pipe(first(), shareReplay());
	sentInvitesSub = new Subject();
	sentInvites$ = this.sentInvitesSub.asObservable().pipe(
		scan((acc) => acc + 1, 0),
		startWith(0)
	);

	remainingInvites$ = combineLatest([
		this.room$.pipe(map((room) => room.remaining_invites)),
		this.sentInvites$,
	]).pipe(
		map(([remaining, sent]) => Math.max(remaining, 0) - sent),
		shareReplay()
	);

	instances$: Observable<ReadonlyArray<void>> = combineLatest([
		this.remainingInvites$.pipe(distinctUntilChanged()),
		this.sentInvites$,
	]).pipe(
		map(([remaining, sent]) => {
			let count;
			if (sent > 0 && remaining === 0) {
				count = sent;
			} else if (remaining > 0 && sent >= this.maxInvitesDisplayed) {
				count = sent + 1;
			} else {
				count = Math.min(remaining + sent, this.maxInvitesDisplayed);
			}
			return new Array(count);
		}),
		distinctUntilChanged()
	);
	domain$ = this.room$.pipe(map((room) => room.domain));

	constructor(private roomService: RoomService) {}

	onInviteSent() {
		this.sentInvitesSub.next();
	}
}
