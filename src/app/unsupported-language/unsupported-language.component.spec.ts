import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnsupportedLanguageComponent } from './unsupported-language.component';

describe('UnsupportedLanguageComponent', () => {
	let component: UnsupportedLanguageComponent;
	let fixture: ComponentFixture<UnsupportedLanguageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [UnsupportedLanguageComponent],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(UnsupportedLanguageComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
