/**
 * Returns a default value when a given value is undefined
 */
export function undefinedFallback<T, U>(value: T, fallback: U) {
	if (value === undefined) {
		return fallback;
	}
	return value;
}
