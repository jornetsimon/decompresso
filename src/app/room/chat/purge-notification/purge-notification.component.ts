import { Component } from '@angular/core';
import { PurgeService } from '@services/purge.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { delay, mapTo } from 'rxjs/operators';
import { merge } from 'rxjs';

@Component({
	selector: 'mas-purge-notification',
	templateUrl: './purge-notification.component.html',
	styleUrls: ['./purge-notification.component.scss'],
	animations: [
		trigger('slideInOutAnimation', [
			state('*', style({})),
			transition(':enter', [
				style({
					transform: 'translateY(-30px)  rotate(356deg)',
				}),
				animate(
					'.5s 0s cubic-bezier(.16,1.35,.3,1.35)',
					style({
						transform: 'translateY(0) rotate(356deg)',
					})
				),
			]),
			transition(':leave', [
				animate(
					'.5s ease-in-out',
					style({
						transform: 'translateY(-10%)',
						opacity: 0,
					})
				),
			]),
		]),
	],
})
export class PurgeNotificationComponent {
	notification$ = merge(
		this.purgeService.notification$,
		this.purgeService.notification$.pipe(delay(10000), mapTo(undefined))
	);
	constructor(public purgeService: PurgeService) {}
}
