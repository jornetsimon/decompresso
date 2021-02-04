import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { db } from './init';
import { Endpoints } from './index';
import { subHours } from 'date-fns';
import { messaging } from 'firebase-admin/lib/messaging';
import { firestore } from 'firebase-admin/lib/firestore';
import { undefinedFallback } from './utilities';
import MulticastMessage = messaging.MulticastMessage;
import Notification = messaging.Notification;
import Timestamp = firestore.Timestamp;

interface UserNotificationSettings {
	new_messages: boolean;
	new_members: boolean;
	token: string;
}

export const sendNewMessagesNotification = functions.https.onCall(async (data, context) => {
	const userDomain = context.auth?.token?.domain;
	// TODO: remove for production
	if (!(context.auth?.token.email_verified && userDomain === 'job-tunnel.com')) {
		return;
	}
	const lastCheck = subHours(Date.now(), 24);
	console.log(`Checking readings since ${lastCheck}`);
	const membersReading = await db
		.collection(Endpoints.Reading)
		.where('last_read_message.createdAt', '<', lastCheck)
		.get();

	const registrationTokens = (
		await Promise.all(
			membersReading.docs.map(
				async (readingDoc): Promise<string | undefined> => {
					const userUid = readingDoc.id;
					const userSnap = await db.doc(`${Endpoints.Users}/${userUid}`).get();
					if (!userSnap.exists) {
						return undefined;
					}
					const user = userSnap.data();
					const userToken = user?.notifications_settings?.token;
					const userAllowsNewMessagesNotifications = undefinedFallback(
						user?.notifications_settings?.new_messages,
						true
					);
					if (!(userToken && userAllowsNewMessagesNotifications)) {
						return undefined;
					}
					const chatSnap = await db.doc(`${Endpoints.Chats}/${user?.domain}`).get();
					const chat = chatSnap.data();
					const lastCheckTimestamp = Timestamp.fromDate(lastCheck);
					const newMessagesSinceLastCheck = !!chat?.messages.find(
						(msg) => msg.createdAt > lastCheckTimestamp
					);
					if (!newMessagesSinceLastCheck) {
						return undefined;
					}
					console.log(
						'User ' + userUid + ' will receive a notification for new messages'
					);
					return userToken;
				}
			)
		)
	)
		// tslint:disable-next-line:readonly-array
		.filter((token) => !!token) as Array<string>;

	// When there is no notification to send
	if (registrationTokens.length === 0) {
		return {
			expected: 0,
			sent: 0,
		};
	}

	const notification: Notification = {
		title: 'Nouveaux messages dans le salon',
	};
	const message: MulticastMessage = {
		notification,
		tokens: registrationTokens,
	};

	console.log(message);

	return admin
		.messaging()
		.sendMulticast(message)
		.then((response) => {
			console.log(response.successCount + ' messages were sent successfully');
			return {
				expected: registrationTokens.length,
				sent: response.successCount,
			};
		});
});

export const setUserNotificationSettings = functions.https.onCall(
	async (settings: Partial<UserNotificationSettings>, context) => {
		if (!(context.auth && context.auth.token.email_verified)) {
			throw new functions.https.HttpsError('failed-precondition', 'not_authenticated');
		}
		const userUid = context.auth?.uid;
		const userRef = db.doc(`${Endpoints.Users}/${userUid}`);
		return userRef.set({ notifications_settings: settings }, { merge: true });
	}
);
