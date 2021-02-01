import { db } from './init';
import { Endpoints } from './index';
import { nicknamePool, shuffleArray } from './nickname';
import * as functions from 'firebase-functions';
import EmailSender from './mail';
import * as admin from 'firebase-admin';
import FieldValue = admin.firestore.FieldValue;

export function createRoom(domain: string) {
	return db
		.doc(`${Endpoints.Rooms}/${domain}`)
		.create({
			domain,
			member_count: 0,
			nickname_pool: shuffleArray(nicknamePool),
			remaining_invites: 10,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		})
		.catch(() => null)
		.then((result) => {
			if (result) {
				return db
					.doc(`${Endpoints.Stats}/global`)
					.set({ totalRooms: FieldValue.increment(1) }, { merge: true });
			}
			return null;
		});
}
export function createChat(domain: string) {
	return db
		.doc(`${Endpoints.Chats}/${domain}`)
		.create({
			messages: [],
			reactions: [],
		})
		.catch(() => null);
}

export const invite = functions.https.onCall(async (data, context) => {
	if (!(context.auth && context.auth.token.email_verified)) {
		throw new functions.https.HttpsError('failed-precondition', 'not_authenticated');
	}
	const email = data.email;
	const userDomain = context.auth?.token?.domain;
	const emailDomain = email.split('@')[1];
	if (emailDomain !== userDomain) {
		throw new functions.https.HttpsError('failed-precondition', 'domain_does_not_match');
	}

	return EmailSender.sendMail({
		from: 'Décompresso <bonjour@decompresso.fr>',
		to: email,
		subject: `[Personnel et confidentiel] Un collègue vous invite à le rejoindre sur Décompresso !`,
		template: 'invite',
		context: {
			domain: userDomain,
		},
	}).then(() =>
		db.doc(`${Endpoints.Rooms}/${userDomain}`).update({
			remaining_invites: admin.firestore.FieldValue.increment(-1),
		})
	);
});
