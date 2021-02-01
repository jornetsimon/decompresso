import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Room } from '@model/room';
import { subDays } from 'date-fns/esm';

@Component({
	selector: 'mas-rooms',
	templateUrl: './rooms.component.html',
	styleUrls: ['./rooms.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoomsComponent {
	numberOfDaysInPast = 30;
	dateLimit = subDays(Date.now(), this.numberOfDaysInPast);
	rooms$ = this.afs
		.collection<Room>('/rooms', (query) =>
			query.where('createdAt', '>=', this.dateLimit).orderBy('createdAt', 'desc')
		)
		.valueChanges();
	constructor(private afs: AngularFirestore) {}
}
