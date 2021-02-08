import { TestBed } from '@angular/core/testing';

import { EnhancementService } from './enhancement.service';

describe('EnhancementService', () => {
	let service: EnhancementService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(EnhancementService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
