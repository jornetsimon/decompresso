import { Directive, HostListener, Input } from '@angular/core';
import { AngularFireAnalytics } from '@angular/fire/analytics';
import { GaEventEnum } from './ga-event.enum';
import { GaBind } from './ga-bind.type';

@Directive({
	selector: '[gaEvent]',
})
export class AnalyticsEventDirective {
	constructor(private analyticsService: AngularFireAnalytics) {}

	@Input() gaBind: GaBind = 'click';
	@Input() gaEvent: GaEventEnum | string;
	@Input() gaParams: { [key: string]: any };

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

			this.analyticsService.logEvent(this.gaEvent);
		} catch (err) {
			console.warn(err);
		}
	}
}
