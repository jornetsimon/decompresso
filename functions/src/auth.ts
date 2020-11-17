import * as functions from 'firebase-functions';
import { Endpoints } from './index';
import { auth, db } from './init';
import { pickNickname } from './nickname';
import { createRoom } from './room';
import * as admin from 'firebase-admin';
import FieldValue = admin.firestore.FieldValue;

const randomColor = require('randomcolor');

const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const createUser = functions.https.onCall(async (data, context) => {
	// Checking that the user is authenticated.
	if (!context.auth) {
		// Throwing an HttpsError so that the client gets the error details.
		throw new functions.https.HttpsError('failed-precondition', 'not_authenticated');
	}
	const uid = context.auth.uid;
	const authUser = await auth.getUser(uid);
	const email = authUser.email;
	if (!email || !email.match(emailPattern)) {
		throw new functions.https.HttpsError('invalid-argument', 'invalid_email');
	}
	const domain = email.split('@')[1];
	const publicDomainMatch = await db.collection(Endpoints.PublicEmailDomains).doc(domain).get();
	const isDomainPublic = publicDomainMatch.exists;

	if (isDomainPublic) {
		// Delete the user
		await auth.deleteUser(uid);
		throw new functions.https.HttpsError('invalid-argument', 'public_email_domain');
	}

	// Create the room in case it does not exist
	await createRoom(domain);

	const nickname = await pickNickname(domain);
	const color = randomColor({
		luminosity: 'dark',
	});
	const user = {
		nickname,
		domain,
		createdAt: admin.firestore.FieldValue.serverTimestamp(),
		color,
	};

	const batch = db.batch();
	batch.set(db.doc(`${Endpoints.Users}/${uid}`), user);
	batch.set(db.doc(`${Endpoints.UserPersonalData}/${uid}`), {
		email,
	});
	batch.set(db.doc(`${Endpoints.Rooms}/${domain}/${Endpoints.RoomMembers}/${uid}`), user);
	batch.update(db.doc(`${Endpoints.Rooms}/${domain}`), 'member_count', FieldValue.increment(1));
	await batch.commit();

	const userSnap = await db.doc(`${Endpoints.Users}/${uid}`).get();
	return userSnap.data();
});

export const deleteUser = functions.https.onCall(async (data, context) => {
	// Checking that the user is authenticated.
	if (!context.auth) {
		// Throwing an HttpsError so that the client gets the error details.
		throw new functions.https.HttpsError('failed-precondition', 'not_authenticated');
	}
	const uid = context.auth.uid;
	const user = (await db.doc(`/users/${uid}`).get()).data();
	if (!user) {
		throw new functions.https.HttpsError('invalid-argument', 'user_does_not_exist');
	}
	const batch = db.batch();
	// Setting the room member as deleted
	batch.update(db.doc(`${Endpoints.Rooms}/${user.domain}/members/${uid}`), { deleted: true });
	// Decrement the room member count
	batch.update(
		db.doc(`${Endpoints.Rooms}/${user.domain}`),
		'member_count',
		FieldValue.increment(-1)
	);
	// Set the deletedAt timestamp in UserPersonalData
	batch.update(db.doc(`${Endpoints.UserPersonalData}/${uid}`), {
		deletedAt: admin.firestore.FieldValue.serverTimestamp(),
	});
	// Delete the document in Users
	batch.delete(db.doc(`${Endpoints.Users}/${uid}`));

	return batch.commit().then(() => {
		// Delete the user in Firebase Auth
		return auth.deleteUser(uid);
	});
});
