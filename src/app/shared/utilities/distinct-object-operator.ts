import { Observable } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

const hash = require('object-hash');

/**
 * Only emit next value when its hash is different from the last
 */
export function distinctObject<T>(source: Observable<T>): Observable<T> {
	return source.pipe(
		distinctUntilChanged((a, b) => {
			return hash(a || {}) === hash(b || {});
		})
	);
}
