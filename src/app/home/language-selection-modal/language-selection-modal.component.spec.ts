import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageSelectionModalComponent } from './language-selection-modal.component';

describe('LanguageSelectionModalComponent', () => {
	let component: LanguageSelectionModalComponent;
	let fixture: ComponentFixture<LanguageSelectionModalComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [LanguageSelectionModalComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(LanguageSelectionModalComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
