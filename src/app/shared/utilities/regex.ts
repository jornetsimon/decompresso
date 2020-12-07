/**
 * Generates a RegExp from a prefix
 */
export function getRegExp(prefix: string | readonly string[]): RegExp {
	const prefixArray = Array.isArray(prefix) ? prefix : [prefix];
	let prefixToken = prefixArray.join('').replace(/([$^])/g, '\\$1');

	if (prefixArray.length > 1) {
		prefixToken = `[${prefixToken}]`;
	}
	return new RegExp(`(\\s|^)(${prefixToken})[^\\s]*`, 'g');
}
