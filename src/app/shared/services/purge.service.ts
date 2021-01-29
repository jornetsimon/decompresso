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
import { filter, map, share, switchMapTo, tap } from 'rxjs/operators';
import { RoomService } from '@services/room.service';

interface PurgeNotification {
	number: number;
	label: string;
}
@Injectable({
	providedIn: 'root',
})
export class PurgeService {
	lastPurge$ = this.roomService.lastPurge$;
	nextPurge$ = this.lastPurge$.pipe(
		map((lastPurge) =>
			addDays(
				lastPurge || startOfWeek(Date.now(), { weekStartsOn: 1 }),
				GLOBAL_CONFIG.chat.purgeIntervalDays
			)
		)
	);
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
		switchMapTo(this.nextPurge$),
		map((nextPurge) => {
			const daysToPurge = differenceInDays(nextPurge, this.today);
			if (daysToPurge === 0) {
				const hoursToPurge = differenceInHours(nextPurge, this.today);
				return {
					number: hoursToPurge,
					label: `heure${hoursToPurge > 1 ? 's' : ''} avant<br/>la chasse d'eau`,
				};
			}
			return {
				number: daysToPurge,
				label: `jour${daysToPurge > 1 ? 's' : ''} avant<br/>la chasse d'eau`,
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

	constructor(private roomService: RoomService) {}
}
