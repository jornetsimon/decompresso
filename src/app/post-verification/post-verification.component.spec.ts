import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostVerificationComponent } from './post-verification.component';

describe('PostVerificationComponent', () => {
	let component: PostVerificationComponent;
	let fixture: ComponentFixture<PostVerificationComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [PostVerificationComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(PostVerificationComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
