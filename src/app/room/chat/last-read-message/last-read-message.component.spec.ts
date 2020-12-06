import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LastReadMessageComponent } from './last-read-message.component';

describe('LastReadMessageComponent', () => {
	let component: LastReadMessageComponent;
	let fixture: ComponentFixture<LastReadMessageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [LastReadMessageComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(LastReadMessageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
