import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { BaseControlValueAccessor } from '@utilities/base-control-value-accessor';
import { FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { PrivateDomainEmailService } from './private-domain-email.service';
import { generateEmailPlaceholder } from './email-placeholder';
import { LayoutService } from '../../layout/layout.service';

@Component({
	selector: 'mas-private-domain-email',
	templateUrl: './private-domain-email.component.html',
	styleUrls: ['./private-domain-email.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => PrivateDomainEmailComponent),
			multi: true,
		},
		{
			provide: NG_VALIDATORS,
			useExisting: forwardRef(() => PrivateDomainEmailComponent),
			multi: true,
		},
	],
})
export class PrivateDomainEmailComponent extends BaseControlValueAccessor<string> {
	// tslint:disable-next-line:readonly-array
	defaultValidators = [
		PrivateDomainEmailService.emailValidator,
		PrivateDomainEmailService.emailDomainIsPrivate,
	];

	control = new FormControl(undefined, [Validators.required]);
	emailPlaceholder: string;

	constructor(private layoutService: LayoutService) {
		super();
		this.control.valueChanges.subscribe((value) => {
			this.sweetChange(value);
		});

		this.emailPlaceholder = generateEmailPlaceholder();
	}

	onInputFocus(focus: boolean) {
		this.layoutService.inputFocusSubject.next(focus);
	}
}
