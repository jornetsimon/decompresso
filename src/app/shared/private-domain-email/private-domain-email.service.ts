import { Injectable } from '@angular/core';
import { ValidatorFn, Validators } from '@angular/forms';

export const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

@Injectable({
	providedIn: 'root',
})
export class PrivateDomainEmailService {
	constructor() {}

	static emailValidator: ValidatorFn = Validators.pattern(emailPattern);
}
