export function undefinedFallback<T, U>(value: T, fallback: U) {
	if (value === undefined) {
		return fallback;
	}
	return value;
}
