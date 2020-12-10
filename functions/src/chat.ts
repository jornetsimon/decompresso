import * as functions from 'firebase-functions';
import { db } from './init';
import { Endpoints } from './index';
import * as admin from 'firebase-admin';

/**
 * When the max message count is reached, delete the oldest ones
 */
export const sliceMessages = functions.firestore.document(`/chats/{domain}`).onUpdate((change) => {
	const data = change.after.data();

	const maxLen = 500;
	const msgLen = data.messages.length;
	const charLen = JSON.stringify(data).length;

	const batch = db.batch();

	if (charLen >= 175000 || msgLen >= maxLen) {
		// Always delete at least 1 message
		const deleteCount = msgLen - maxLen <= 0 ? 1 : msgLen - maxLen;
		data.messages.splice(0, deleteCount);

		const ref = db.doc(`/chats/${change.after.id}`);

		batch.set(ref, data, { merge: true });

		return batch.commit();
	} else {
		return null;
	}
});

/**
 * Purge the chat messages and reactions weekly
 */
export const purgeChat = functions.pubsub
	.schedule('0 0 * * 1') // Every monday morning (00:00)
	.timeZone('Europe/Paris')
	.onRun(async (context) => {
		console.log('RUNNING PURGE');
		const chatRefs = await db.collection(Endpoints.Chats).get();
		const chatJobs = chatRefs.docs.map((snapshot) => {
			return snapshot.ref.set({
				messages: [],
				reactions: [],
				last_purge: admin.firestore.FieldValue.serverTimestamp(),
			});
		});

		// Execute all jobs concurrently
		return await Promise.all(chatJobs);
	});
