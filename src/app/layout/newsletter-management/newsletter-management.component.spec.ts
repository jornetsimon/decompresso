import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsletterManagementComponent } from './newsletter-management.component';

describe('NewsletterManagementComponent', () => {
	let component: NewsletterManagementComponent;
	let fixture: ComponentFixture<NewsletterManagementComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [NewsletterManagementComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(NewsletterManagementComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
