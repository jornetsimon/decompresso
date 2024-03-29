import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CookiesConsentService } from './cookies-consent.service';

@Component({
	selector: 'mas-cookies-consent',
	templateUrl: './cookies-consent.component.html',
	styleUrls: ['./cookies-consent.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookiesConsentComponent {
	accepted$ = this.cookiesConsentService.accepted$;
	constructor(private cookiesConsentService: CookiesConsentService) {}
	accept() {
		this.cookiesConsentService.acceptCookies();
	}
}
