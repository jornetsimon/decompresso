import { TestBed } from '@angular/core/testing';

import { PurgeService } from './purge.service';

describe('PurgeService', () => {
	let service: PurgeService;

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(PurgeService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});
});
