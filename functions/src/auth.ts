import * as functions from 'firebase-functions';
import { Endpoints } from './index';
import { auth, db } from './init';

const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const createUser = functions.https.onCall(async (data, context) => {
	// Checking that the user is authenticated.
	if (!context.auth) {
		// Throwing an HttpsError so that the client gets the error details.
		throw new functions.https.HttpsError('failed-precondition', 'not_authenticated');
	}
	const uid = context.auth.uid;
	const user = await auth.getUser(uid);
	const email = user.email;
	if (!email || !email.match(emailPattern)) {
		throw new functions.https.HttpsError('invalid-argument', 'invalid_email');
	}
	const domain = email.split('@')[1];
	const publicDomainMatch = await db.collection(Endpoints.PublicEmailDomains).doc(domain).get();
	const isDomainPublic = publicDomainMatch.exists;

	if (isDomainPublic) {
		// Delete the user
		auth.deleteUser(uid);
		throw new functions.https.HttpsError('invalid-argument', 'public_email_domain');
	}

	const batch = db.batch();
	batch.set(db.doc(`${Endpoints.Users}/${uid}`), {
		// TODO : generate random nickname
		nickname: 'FidèleCastor',
	});
	batch.set(db.doc(`${Endpoints.UserPersonalData}/${uid}`), {
		email,
	});
	await batch.commit();
	const userSnapshot = await db.doc(`${Endpoints.Users}/${uid}`).get();
	return userSnapshot.data();
});
