import { Injectable } from '@angular/core';
import { ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { PUBLIC_DOMAINS } from './public-domains';

export const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

@Injectable({
	providedIn: 'root',
})
export class PrivateDomainEmailService {
	constructor() {}

	/**
	 * Validates an email address
	 */
	static emailValidator: ValidatorFn = Validators.pattern(emailPattern);

	/**
	 * Validates an email address is from a private domain
	 * Uses a local list of public email domains
	 * @see PUBLIC_DOMAINS
	 */
	static emailDomainIsPrivate: ValidatorFn = (control): ValidationErrors | null => {
		const controlValue: string | undefined = control.value;
		if (!controlValue || controlValue.split('@').length < 2) {
			// Domain can't be determined
			return null;
		}
		const controlDomain = controlValue.split('@')[1];
		const isDomainPublic =
			PUBLIC_DOMAINS.find((element) => element.domain === controlDomain) !== undefined;
		if (isDomainPublic) {
			return { emailDomainIsPublic: true };
		}
		return null;
	};
}
