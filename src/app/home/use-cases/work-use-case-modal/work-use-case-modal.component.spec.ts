import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkUseCaseModalComponent } from './work-use-case-modal.component';

describe('WorkUseCaseModalComponent', () => {
	let component: WorkUseCaseModalComponent;
	let fixture: ComponentFixture<WorkUseCaseModalComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [WorkUseCaseModalComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(WorkUseCaseModalComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
