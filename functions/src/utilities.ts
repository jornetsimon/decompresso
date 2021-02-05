import { Observable } from 'rxjs';

/**
 * Returns a default value when a given value is undefined
 */

export function undefinedFallback<T, U>(value: T, fallback: U) {
	if (value === undefined) {
		return fallback;
	}
	return value;
}
export function fromDocRef<T>(ref: FirebaseFirestore.DocumentReference<T>) {
	return new Observable((observer) => {
		return ref.onSnapshot(
			(snap) => observer.next(snap.data()),
			(err) => observer.error(err)
		);
	});
}

export function randomIntFromInterval(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1) + min);
}
