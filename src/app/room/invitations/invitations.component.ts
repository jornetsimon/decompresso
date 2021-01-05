import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RoomService } from '@services/room.service';
import { distinctUntilChanged, map, scan, startWith } from 'rxjs/operators';
import { combineLatest, Observable, Subject } from 'rxjs';

@Component({
	selector: 'mas-invitations',
	templateUrl: './invitations.component.html',
	styleUrls: ['./invitations.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitationsComponent {
	private readonly maxInvitesDisplayed = 3;
	sentInvitesSub = new Subject();
	sentInvites$ = this.sentInvitesSub.asObservable().pipe(
		scan((acc) => acc + 1, 0),
		startWith(0)
	);

	remainingInvites$ = combineLatest([
		this.roomService.room$.pipe(map((room) => room.remaining_invites)),
		this.sentInvites$,
	]).pipe(map(([remaining, sent]) => remaining - sent));

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
	domain$ = this.roomService.room$.pipe(map((room) => room.domain));

	constructor(private roomService: RoomService) {}
}
