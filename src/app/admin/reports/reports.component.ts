import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Report } from '@model/report';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { shareReplay } from 'rxjs/operators';

@Component({
	selector: 'mas-reports',
	templateUrl: './reports.component.html',
	styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent {
	reports$: Observable<ReadonlyArray<Report & { id: string }>> = this.afs
		.collectionGroup<Report>('reports', (query) => query.where('moderation', '==', 'pending'))
		.valueChanges({ idField: 'id' })
		.pipe(shareReplay(1));
	constructor(
		private afs: AngularFirestore,
		private router: Router,
		private route: ActivatedRoute
	) {}

	onReportSelected(report: Report & { id: string }) {
		this.router.navigate([report.id], {
			relativeTo: this.route,
			queryParams: { domain: report.message_author.domain },
		});
	}
}
