import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class NotificationsService {
	private subject = new Subject<string>();
	private notificationThrottler$ = this.subject.asObservable().pipe();
	constructor() {}

	/**
	 * Prompts the user to accept future notifications
	 */
	requestPermission(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (!('Notification' in window)) {
				reject('This browser does not support desktop notification');
			} else if (Notification.permission === 'granted') {
				resolve(false);
			} else {
				Notification.requestPermission().then((permission) => {
					if (permission !== 'granted') {
						reject('denied_in_browser');
					}
					resolve(true);
				});
			}
		});
	}

	notify(content?: string) {
		this.subject.next(content);
	}
}
