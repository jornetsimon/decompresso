import * as functions from 'firebase-functions';
import { db } from './init';
import { Endpoints } from './index';

export const setUserNewsletterSettings = functions.https.onCall(async (settings, context) => {
	if (!(context.auth && context.auth.token.email_verified)) {
		throw new functions.https.HttpsError('failed-precondition', 'not_authenticated');
	}
	const userUid = context.auth?.uid;
	const userRef = db.doc(`${Endpoints.Users}/${userUid}`);
	const cleanSettings: any = Object.keys(settings)
		.filter((k) => settings[k] !== null)
		.reduce((a, k) => ({ ...a, [k]: settings[k] }), {});
	return userRef.set(
		{
			newsletter_settings: cleanSettings,
		},
		{ merge: true }
	);
});
