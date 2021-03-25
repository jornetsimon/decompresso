import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchoolUseCaseModalComponent } from './school-use-case-modal.component';

describe('SchoolUseCaseModalComponent', () => {
	let component: SchoolUseCaseModalComponent;
	let fixture: ComponentFixture<SchoolUseCaseModalComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [SchoolUseCaseModalComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(SchoolUseCaseModalComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
