import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { combineLatest, Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ModerationType, Report } from '@model/report';
import { first, map, shareReplay, switchMap } from 'rxjs/operators';
import { DataService, expectData } from '@services/data.service';
import { environment } from '../../../../environments/environment';
import firebase from 'firebase/app';
import { Message } from '@model/message';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
	selector: 'mas-report',
	templateUrl: './report.component.html',
	styleUrls: ['./report.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportComponent {
	id$: Observable<string> = this.activatedRoute.params.pipe(map((params) => params.id));
	domain$: Observable<string> = this.activatedRoute.queryParams.pipe(map((p) => p.domain));
	report$: Observable<Report & { id: string }> = combineLatest([this.id$, this.domain$]).pipe(
		switchMap(([id, domain]) =>
			this.dataService.reportsCol(domain).doc(id).valueChanges({ idField: 'id' })
		),
		expectData,
		shareReplay(1)
	);
	firestoreConsoleReportUrl$ = this.report$.pipe(
		map(
			(report) =>
				`https://console.firebase.google.com/u/1/project/${environment.firebase.projectId}/firestore/data~2Frooms~2F${report.message_author.domain}~2Freports~${report.id}`
		)
	);
	constructor(
		private afs: AngularFirestore,
		private dataService: DataService,
		private activatedRoute: ActivatedRoute,
		private message: NzMessageService
	) {}

	action(type: ModerationType) {
		combineLatest([
			this.report$,
			this.domain$.pipe(
				switchMap((domain) => this.dataService.chat$(domain)),
				expectData
			),
		])
			.pipe(
				first(),
				switchMap(([report, chat]) => {
					const reportUpdate = this.dataService
						.reportsCol(report.message_author.domain)
						.doc(report.id)
						.update({ moderation: type });
					if (type === 'moderate') {
						const chatDoc = this.dataService.chatDoc(report.message_author.domain);
						const message: Message = chat.messages.find(
							(m) => m.uid === report.message.uid
						)!;
						const batch = this.afs.firestore.batch();

						batch.update(chatDoc.ref, {
							messages: firebase.firestore.FieldValue.arrayRemove(message),
						});
						batch.update(chatDoc.ref, {
							messages: firebase.firestore.FieldValue.arrayUnion({
								...message,
								moderated: true,
							}),
						});

						return combineLatest([reportUpdate, batch.commit()]);
					} else {
						return reportUpdate;
					}
				})
			)
			.subscribe(
				() => {
					this.message.success(
						type === 'moderate' ? 'Modération prise en compte' : 'Signalement ignoré'
					);
				},
				(error) => {
					console.error(error);
					this.message.error('Erreur de traitement du signalement');
				}
			);
	}
}
