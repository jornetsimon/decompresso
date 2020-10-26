import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
	selector: 'mas-signin',
	templateUrl: './signin.component.html',
	styleUrls: ['./signin.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SigninComponent implements OnInit {
	formGroup = new FormGroup({
		email: new FormControl(undefined, [Validators.required]),
	});

	constructor() {}

	ngOnInit(): void {}

	emailControlStatus(): 'success' | 'warning' | 'error' | 'validating' | '' {
		const control = this.formGroup.get('email');
		if (!control || control.untouched || !control.value) {
			return '';
		}
		if (control.errors) {
			const errorCount = Object.keys(control.errors).length;
			if (errorCount === 1 && Object.keys(control.errors)[0] === 'pattern') {
				return 'warning';
			} else {
				return 'error';
			}
		}
		return 'success';
	}
}
