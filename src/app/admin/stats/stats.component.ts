import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { GlobalStats } from './global-stats';
import { expectData } from '@services/data.service';
import { Observable } from 'rxjs';
import { GLOBAL_CONFIG } from '../../global-config';
import { differenceInDays } from 'date-fns/esm';

@Component({
	selector: 'mas-stats',
	templateUrl: './stats.component.html',
	styleUrls: ['./stats.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsComponent {
	daysSinceLaunch = differenceInDays(Date.now(), GLOBAL_CONFIG.launch_date);
	globalStats$: Observable<GlobalStats> = this.afs
		.doc<GlobalStats>('/stats/global')
		.valueChanges()
		.pipe(expectData);
	constructor(private afs: AngularFirestore) {}
}
