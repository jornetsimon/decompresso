import { Directive, HostListener, Input } from '@angular/core';
import { GaEventEnum } from './ga-event.enum';
import { GaBind } from './ga-bind.type';
import { AnalyticsService } from '@analytics/analytics.service';
import { GaCategoryEnum } from '@analytics/ga-category.enum';

@Directive({
	selector: '[gaEvent]',
})
export class AnalyticsEventDirective {
	constructor(private analyticsService: AnalyticsService) {}

	@Input() gaBind: GaBind = 'click';
	@Input() gaEvent: GaEventEnum | string;
	@Input() gaParams: { [key: string]: any };
	@Input() gaCategory: GaCategoryEnum | string;
	@Input() gaLabel: string;
	@Input() gaValue: any;

	@HostListener('click')
	onClick() {
		if (this.gaBind === 'click') {
			this.trigger();
		}
	}

	@HostListener('focus')
	onFocus() {
		if (this.gaBind === 'focus') {
			this.trigger();
		}
	}

	@HostListener('blur')
	onBlur() {
		if (this.gaBind === 'blur') {
			this.trigger();
		}
	}

	@HostListener('mouseenter')
	onHover() {
		if (this.gaBind === 'hover') {
			this.trigger();
		}
	}

	protected trigger() {
		try {
			if (!this.gaEvent) {
				throw new Error('You must provide a gaAction attribute to identify this event.');
			}

			this.analyticsService.logEvent(
				this.gaEvent,
				this.gaCategory,
				this.gaLabel,
				this.gaValue
			);
		} catch (err) {
			console.warn(err);
		}
	}
}
