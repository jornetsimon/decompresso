import { Inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@utilities/timestamp';
import { DatePipe } from '@angular/common';

@Pipe({
	name: 'timestampToDate',
})
export class TimestampToDatePipe implements PipeTransform {
	constructor(@Inject(LOCALE_ID) private _locale: string) {}

	transform(
		value: Timestamp | null | undefined,
		format?: string,
		timezone?: string,
		locale?: string
	) {
		const datePipe = new DatePipe(this._locale);
		return datePipe.transform(
			value?.seconds ? value?.seconds * 1000 : null,
			format,
			timezone,
			locale
		);
	}
}
