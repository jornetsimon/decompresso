import { Injectable } from '@angular/core';
import {
	addDays,
	differenceInDays,
	differenceInHours,
	fromUnixTime,
	isAfter,
	isSameDay,
	setDay,
	startOfDay,
	startOfWeek,
} from 'date-fns/esm';
import { GLOBAL_CONFIG } from '../../global-config';
import { Observable, timer } from 'rxjs';
import { filter, map, share, tap } from 'rxjs/operators';

interface PurgeNotification {
	number: number;
	label: string;
}
@Injectable({
	providedIn: 'root',
})
export class PurgeService {
	lastPurge: Date = startOfWeek(Date.now(), { weekStartsOn: 1 }); // TODO: replace with actual value from DB
	nextPurge: Date;
	private notificationInitialDelay = 3000;
	private notificationCheckIntervalHours = 1;
	private today = Date.now();
	notification$: Observable<PurgeNotification> = timer(
		this.notificationInitialDelay,
		this.notificationCheckIntervalHours * 60 * 60 * 1000
	).pipe(
		filter(() => {
			const lastNotificationDateStr = window.localStorage.getItem('last-purge-notification');
			const lastNotificationDate = lastNotificationDateStr
				? fromUnixTime(parseInt(lastNotificationDateStr, 10))
				: null;
			const alreadyNotifiedForToday =
				lastNotificationDate && isSameDay(lastNotificationDate, this.today);

			// Only if after thursday and we haven't already notified today
			return (
				isAfter(this.today, startOfDay(setDay(this.today, 4, { weekStartsOn: 1 }))) &&
				!alreadyNotifiedForToday
			);
		}),
		map(() => {
			const daysToPurge = differenceInDays(this.nextPurge, this.today);
			if (daysToPurge === 0) {
				const hoursToPurge = differenceInHours(this.nextPurge, this.today);
				return {
					number: hoursToPurge,
					label: `heure${hoursToPurge > 1 ? 's' : ''} avant<br/>la purge`,
				};
			}
			return {
				number: daysToPurge,
				label: `jour${daysToPurge > 1 ? 's' : ''} avant<br/>la purge`,
			};
		}),
		tap(() => {
			window.localStorage.setItem(
				'last-purge-notification',
				Math.floor(Date.now() / 1000).toString()
			);
		}),
		share()
	);

	constructor() {
		this.nextPurge = addDays(this.lastPurge, GLOBAL_CONFIG.chat.purgeIntervalDays);
	}
}
