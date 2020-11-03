// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const login = functions.https.onCall((data, context) => {
	const email: string = data.email;
	if (!email.match(emailPattern)) {
		throw new functions.https.HttpsError(
			'invalid-argument',
			'The provided attribute is not a valid email'
		);
	}
	const domain = email.split('@')[1];
	console.log('domain', domain);
});
