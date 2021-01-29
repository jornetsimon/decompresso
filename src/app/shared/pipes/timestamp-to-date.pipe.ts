import { Inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@utilities/timestamp';
import { DatePipe } from '@angular/common';
import { formatRelative, fromUnixTime } from 'date-fns/esm';
import { frLocale } from '@utilities/date-fns/locales/fr/fr-locale';

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
		if (format === 'relative') {
			if (!value?.seconds) {
				return null;
			}
			return formatRelative(fromUnixTime(value?.seconds), new Date(), {
				locale: frLocale,
				weekStartsOn: 1,
			});
		}
		const datePipe = new DatePipe(this._locale);
		return datePipe.transform(
			value?.seconds ? value?.seconds * 1000 : null,
			format,
			timezone,
			locale
		);
	}
}
