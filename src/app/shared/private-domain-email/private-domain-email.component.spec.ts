import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateDomainEmailComponent } from './private-domain-email.component';

describe('PrivateDomainEmailComponent', () => {
	let component: PrivateDomainEmailComponent;
	let fixture: ComponentFixture<PrivateDomainEmailComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [PrivateDomainEmailComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(PrivateDomainEmailComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
