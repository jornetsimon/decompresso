import { TestBed } from '@angular/core/testing';

import { PrivateDomainEmailService } from './private-domain-email.service';

describe('PrivateDomainEmailService', () => {
	let service: PrivateDomainEmailService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(PrivateDomainEmailService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
