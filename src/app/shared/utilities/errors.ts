import firebase from 'firebase';
import FirebaseError = firebase.FirebaseError;

export type ErrorWithCode = Error & { code: string };
/**
 * FirebaseError type guard
 */
export function isFirebaseError(error: Error): error is FirebaseError {
	return !!(error as FirebaseError).code;
}
