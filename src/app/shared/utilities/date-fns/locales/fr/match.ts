const matchOrdinalNumberPattern = /^(\d+)(ième|ère|ème|er|e)?/i;
const parseOrdinalNumberPattern = /\d+/i;
const matchEraPatterns = {
	narrow: /^(av\.J\.C|ap\.J\.C|ap\.J\.-C)/i,
	abbreviated: /^(av\.J\.-C|av\.J-C|apr\.J\.-C|apr\.J-C|ap\.J-C)/i,
	wide: /^(avant Jésus-Christ|après Jésus-Christ)/i,
};
const parseEraPatterns = {
	any: [/^av/i, /^ap/i],
};
const matchQuarterPatterns = {
	narrow: /^[1234]/i,
	abbreviated: /^t[1234]/i,
	wide: /^[1234](er|ème|e)? trimestre/i,
};
const parseQuarterPatterns = {
	any: [/1/i, /2/i, /3/i, /4/i],
};
const matchMonthPatterns = {
	narrow: /^[jfmasond]/i,
	abbreviated: /^(janv|févr|mars|avr|mai|juin|juill|juil|août|sept|oct|nov|déc)\.?/i,
	wide: /^(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i,
};
const parseMonthPatterns = {
	narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
	any: [
		/^ja/i,
		/^f/i,
		/^mar/i,
		/^av/i,
		/^ma/i,
		/^juin/i,
		/^juil/i,
		/^ao/i,
		/^s/i,
		/^o/i,
		/^n/i,
		/^d/i,
	],
};
const matchDayPatterns = {
	narrow: /^[lmjvsd]/i,
	short: /^(di|lu|ma|me|je|ve|sa)/i,
	abbreviated: /^(dim|lun|mar|mer|jeu|ven|sam)\.?/i,
	wide: /^(dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi)/i,
};
const parseDayPatterns = {
	narrow: [/^d/i, /^l/i, /^m/i, /^m/i, /^j/i, /^v/i, /^s/i],
	any: [/^di/i, /^lu/i, /^ma/i, /^me/i, /^je/i, /^ve/i, /^sa/i],
};
const matchDayPeriodPatterns = {
	narrow: /^(a|p|minuit|midi|mat\.?|ap\.?m\.?|soir|nuit)/i,
	any: /^([ap]\.?\s?m\.?|du matin|de l'après[-\s]midi|du soir|de la nuit)/i,
};
const parseDayPeriodPatterns = {
	any: {
		am: /^a/i,
		pm: /^p/i,
		midnight: /^min/i,
		noon: /^mid/i,
		morning: /mat/i,
		afternoon: /ap/i,
		evening: /soir/i,
		night: /nuit/i,
	},
};
export const match = {
	ordinalNumber: buildMatchPatternFn({
		matchPattern: matchOrdinalNumberPattern,
		parsePattern: parseOrdinalNumberPattern,
		valueCallback: (value) => parseInt(value, 10),
	}),
	era: buildMatchFn({
		matchPatterns: matchEraPatterns,
		defaultMatchWidth: 'wide',
		parsePatterns: parseEraPatterns,
		defaultParseWidth: 'any',
	}),
	quarter: buildMatchFn({
		matchPatterns: matchQuarterPatterns,
		defaultMatchWidth: 'wide',
		parsePatterns: parseQuarterPatterns,
		defaultParseWidth: 'any',
		valueCallback: (index) => index + 1,
	}),
	month: buildMatchFn({
		matchPatterns: matchMonthPatterns,
		defaultMatchWidth: 'wide',
		parsePatterns: parseMonthPatterns,
		defaultParseWidth: 'any',
	}),
	day: buildMatchFn({
		matchPatterns: matchDayPatterns,
		defaultMatchWidth: 'wide',
		parsePatterns: parseDayPatterns,
		defaultParseWidth: 'any',
	}),
	dayPeriod: buildMatchFn({
		matchPatterns: matchDayPeriodPatterns,
		defaultMatchWidth: 'any',
		parsePatterns: parseDayPeriodPatterns,
		defaultParseWidth: 'any',
	}),
};

function buildMatchPatternFn(args) {
	return (dirtyString, dirtyOptions) => {
		const str = String(dirtyString);
		const options = dirtyOptions || {};
		const matchResult = str.match(args.matchPattern);

		if (!matchResult) {
			return null;
		}

		const matchedString = matchResult[0];
		const parseResult = str.match(args.parsePattern);

		if (!parseResult) {
			return null;
		}

		let value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
		value = options.valueCallback ? options.valueCallback(value) : value;
		return {
			value,
			rest: str.slice(matchedString.length),
		};
	};
}

function buildMatchFn(args) {
	return (dirtyString, dirtyOptions) => {
		const str = String(dirtyString);
		const options = dirtyOptions || {};
		const width = options.width;
		const matchPattern =
			(width && args.matchPatterns[width]) || args.matchPatterns[args.defaultMatchWidth];
		const matchResult = str.match(matchPattern);

		if (!matchResult) {
			return null;
		}

		const matchedString = matchResult[0];
		const parsePatterns =
			(width && args.parsePatterns[width]) || args.parsePatterns[args.defaultParseWidth];
		let value;

		if (Object.prototype.toString.call(parsePatterns) === '[object Array]') {
			value = findIndex(parsePatterns, (pattern) => pattern.test(matchedString));
		} else {
			value = findKey(parsePatterns, (pattern) => pattern.test(matchedString));
		}

		value = args.valueCallback ? args.valueCallback(value) : value;
		value = options.valueCallback ? options.valueCallback(value) : value;
		return {
			value,
			rest: str.slice(matchedString.length),
		};
	};
}

function findKey(object, predicate) {
	for (const key in object) {
		if (object.hasOwnProperty(key) && predicate(object[key])) {
			return key;
		}
	}
}

function findIndex(array, predicate) {
	for (let key = 0; key < array.length; key++) {
		if (predicate(array[key])) {
			return key;
		}
	}
}
