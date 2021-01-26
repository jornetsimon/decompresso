import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { debounceTime, filter, scan, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export type ActionType = 'read' | 'write' | 'delete';
export interface Action {
	model: string;
	type: ActionType;
	data: any;
}
export enum ActionTypeColor {
	read = '#1a73e8',
	write = '#673ab7',
	delete = '#ff764b',
	total = '#FFD84B',
}

@Injectable({
	providedIn: 'root',
})
export class FirestoreTrackerService {
	private actionsSubject = new Subject<Action>();
	actions$ = this.actionsSubject.asObservable();

	constructor() {
		if (!environment.production) {
			this.actions$.subscribe((action) => {
				console.log(
					`%c[${action.type.toUpperCase()}: ${action.model}]`,
					`background: ${ActionTypeColor[action.type]}; color: #fff; padding: 3px;`,
					action.data
				);
			});
			this.actions$
				.pipe(
					filter((action) => action.type === 'read'),
					scan((acc, value) => {
						return acc + 1;
					}, 0),
					debounceTime(2000)
				)
				.subscribe((total) => {
					console.log(
						`%c[Total READS: ${total}]`,
						`background: ${ActionTypeColor.total}; color: #000; padding: 3px;`
					);
				});
		}
	}

	logAction(model: string, type: ActionType = 'read') {
		return <T>(source: Observable<T>): Observable<T> => {
			return source.pipe(
				tap((data) =>
					this.actionsSubject.next({
						model,
						type,
						data,
					})
				)
			);
		};
	}
}
