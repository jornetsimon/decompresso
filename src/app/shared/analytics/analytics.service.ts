import { Injectable } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/analytics';
import { GaEventEnum } from '@analytics/ga-event.enum';
import { GaCategoryEnum } from '@analytics/ga-category.enum';
import { AuthService } from '@services/auth.service';
import { map } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Injectable({
	providedIn: 'root',
})
export class AnalyticsService {
	private domain: string | undefined;
	constructor(private fireAnalytics: AngularFireAnalytics, private authService: AuthService) {
		this.authService.user$
			.pipe(
				map((user) => user?.domain),
				untilDestroyed(this)
			)
			.subscribe((domain) => (this.domain = domain));
	}

	/**
	 * Send an event trigger to Google Analytics via AngularFireAnalytics
	 *
	 * @param eventName 'video_auto_play_start'
	 * @param category 'video_auto_play'
	 * @param label 'My promotional video'
	 * @param value An value to measure something
	 * @param otherParams Any other event parameter
	 */
	logEvent(
		eventName: GaEventEnum | string,
		category?: GaCategoryEnum | string,
		label?: string,
		value?: number,
		otherParams?: Record<string, any>
	) {
		const params: Record<string, any> = {};
		params.event_category ||= category;
		params.event_label ||= label;
		params.value ??= value;
		params.domain ||= this.domain;

		const allParams = { ...params, ...otherParams };

		this.fireAnalytics.logEvent(
			eventName as string,
			Object.keys(allParams).length ? allParams : undefined
		);
	}
}
