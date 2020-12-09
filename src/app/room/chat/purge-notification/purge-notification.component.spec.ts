import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurgeNotificationComponent } from './purge-notification.component';

describe('PurgeNotificationComponent', () => {
	let component: PurgeNotificationComponent;
	let fixture: ComponentFixture<PurgeNotificationComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [PurgeNotificationComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(PurgeNotificationComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
