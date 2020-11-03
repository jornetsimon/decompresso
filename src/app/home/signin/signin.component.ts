import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/auth.service';
import { filter, share, switchMap, tap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
	selector: 'mas-signin',
	templateUrl: './signin.component.html',
	styleUrls: ['./signin.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SigninComponent {
	loading: boolean;
	private submitSubject = new Subject<void>();
	submit$ = this.submitSubject.asObservable();
	formGroup = new FormGroup({
		email: new FormControl(undefined, [Validators.required]),
	});

	submitState$: Observable<{
		status: string;
		message?: string;
	}> = this.submit$.pipe(
		tap(() => {
			this.loading = true;
		}),
		filter(() => this.formGroup.valid),
		switchMap(() => this.authService.sendSignInLink(this.formGroup.value.email)),
		tap(() => {
			this.loading = false;
		}),
		share()
	);

	constructor(public authService: AuthService) {}

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

	submitClicked() {
		this.submitSubject.next();
	}
}
