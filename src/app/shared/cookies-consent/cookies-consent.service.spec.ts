import { TestBed } from '@angular/core/testing';

import { CookiesConsentService } from './cookies-consent.service';

describe('CookiesConsentService', () => {
	let service: CookiesConsentService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(CookiesConsentService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
