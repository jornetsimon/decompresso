import * as functions from 'firebase-functions';
import { db } from './init';

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
