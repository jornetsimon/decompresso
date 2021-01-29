import { formatDistance } from '@utilities/date-fns/locales/fr/formatDistance';
import { formatLong } from '@utilities/date-fns/locales/fr/formatLong';
import { formatRelative } from '@utilities/date-fns/locales/fr/formatRelative';
import { localize } from '@utilities/date-fns/locales/fr/localize';
import { match } from '@utilities/date-fns/locales/fr/match';

export const frLocale: Locale = {
	code: 'fr',
	formatDistance,
	formatLong,
	formatRelative,
	localize,
	match,
	options: {
		weekStartsOn: 1,
		firstWeekContainsDate: 1,
	},
};
