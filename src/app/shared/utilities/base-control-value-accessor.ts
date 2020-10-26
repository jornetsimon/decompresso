import {
	AbstractControl,
	AsyncValidatorFn,
	ControlValueAccessor,
	Validator,
	ValidatorFn,
} from '@angular/forms';

export abstract class BaseControlValueAccessor<T> implements ControlValueAccessor, Validator {
	public disabled;
	// tslint:disable-next-line:readonly-array
	protected defaultValidators: ValidatorFn | ValidatorFn[];
	// tslint:disable-next-line:readonly-array
	protected defaultAsyncValidators: AsyncValidatorFn | AsyncValidatorFn[];
	protected useDefaultValidators = true;

	/**
	 * Call when value has changed programatically
	 */
	protected _value: T;
	// noinspection JSUnusedLocalSymbols
	public onChange(newVal: T) {}
	public onTouched(_?: any) {}

	/**
	 * Syntactic sugar to trigger both onTouched() and onChange() methods
	 */
	public sweetChange(newVal: T) {
		this.onTouched();
		this.onChange(newVal);
	}

	/**
	 * Model -> View changes
	 */
	public writeValue(obj: T): void {
		this._value = obj;
	}
	public registerOnChange(fn: any): void {
		this.onChange = fn;
	}
	public registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}
	public setDisabledState(isDisabled: boolean): void {
		this.disabled = isDisabled;
	}

	/**
	 * Sets default validators, if specified
	 * Requires the adding the NG_VALIDATORS injection to the component providers
	 */
	validate(control: AbstractControl): any {
		if (this.useDefaultValidators && this.defaultValidators) {
			control.setValidators(this.defaultValidators);
		}
		if (this.useDefaultValidators && this.defaultAsyncValidators) {
			control.setAsyncValidators(this.defaultAsyncValidators);
		}
		return null;
	}
}
