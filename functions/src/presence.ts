import { db } from './init';
import * as functions from 'firebase-functions';
import { Endpoints } from './index';

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

		const domain = (context.auth?.token as any)?.domain;
		if (!domain) {
			return null;
		}
		const memberRef = db.doc(
			`${Endpoints.Rooms}/${domain}/${Endpoints.RoomMembers}/${context.params.uid}`
		);

		// It is likely that the Realtime Database change that triggered
		// this event has already been overwritten by a fast change in
		// online / offline status, so we'll re-read the current data
		// and compare the timestamps.
		const statusSnapshot = await change.after.ref.once('value');
		const status = statusSnapshot.val();

		// If the current timestamp for this data is newer than
		// the data that triggered this event, we exit this function.
		if (status.last_changed > eventStatus.last_state_update) {
			return null;
		}

		// ... and write it to Firestore.
		return memberRef.update({
			state: eventStatus.state,
			last_state_update: new Date(eventStatus.last_state_update),
		});
	});
