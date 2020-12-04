import { db } from './init';
import * as functions from 'firebase-functions';

/**
 * Update Firestore on user connection status change in Realtime Database
 */
export const onUserStatusChanged = functions.database
	.ref('/status/{uid}')
	.onUpdate(async (change, context) => {
		// Get the data written to Realtime Database
		const eventStatus: {
			state: 'online' | 'offline';
			last_state_update: number;
		} = change.after.val();

		// Then use other event data to create a reference to the
		// corresponding Firestore document.
		const userStatusFirestoreRef = db.doc(`users/${context.params.uid}`);

		// It is likely that the Realtime Database change that triggered
		// this event has already been overwritten by a fast change in
		// online / offline status, so we'll re-read the current data
		// and compare the timestamps.
		const statusSnapshot = await change.after.ref.once('value');
		const status = statusSnapshot.val();
		console.log(status, eventStatus);

		// If the current timestamp for this data is newer than
		// the data that triggered this event, we exit this function.
		if (status.last_changed > eventStatus.last_state_update) {
			console.log('CANCELLED');
			return null;
		}

		console.log('writing');
		// ... and write it to Firestore.
		return userStatusFirestoreRef.update({
			state: eventStatus.state,
			last_state_update: new Date(eventStatus.last_state_update),
		});
	});
