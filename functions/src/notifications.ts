import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { db } from './init';
import { Endpoints } from './index';
import { differenceInDays, set, subHours } from 'date-fns';
import { messaging } from 'firebase-admin/lib/messaging';
import { firestore } from 'firebase-admin/lib/firestore';
import { fromDocRef, randomIntFromInterval, undefinedFallback } from './utilities';
import { Observable, of } from 'rxjs';
import { filter, map, take, timeoutWith } from 'rxjs/operators';
import MulticastMessage = messaging.MulticastMessage;
import Notification = messaging.Notification;
import Timestamp = firestore.Timestamp;

interface UserNotificationSettings {
	new_messages: boolean;
	new_members: boolean;
	token: string;
}

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

export const sendNewMessagesNotification = functions.pubsub
	.schedule('0 10 * * 1-6') // At 10:00 on every day-of-week from Monday through Saturday
	.timeZone('Europe/Paris')
	.onRun(async (context) => {
		const lastCheck = set(subHours(Date.now(), 24), {
			hours: 10,
			minutes: 0,
			seconds: 0,
			milliseconds: 0,
		});
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
						const userRef = db.doc(`${Endpoints.Users}/${userUid}`);

						// Check if the user exists
						const userSnap = await userRef.get();
						if (!userSnap.exists) {
							return undefined;
						}

						// Check if the user allows this notification type
						const user = userSnap.data();
						const userToken = user?.notifications_settings?.token;
						const userAllowsNewMessagesNotifications = undefinedFallback(
							user?.notifications_settings?.new_messages,
							true
						);
						if (!(userToken && userAllowsNewMessagesNotifications)) {
							return undefined;
						}

						// TODO: testing only
						if (user?.domain !== 'job-tunnel.com') {
							return undefined;
						}

						// Check if the last notification was not sent earlier than 3 days ago.
						const lastNotificationDate: Date = set(
							user?.last_notifications?.new_messages?.toDate(),
							{
								hours: 10,
								minutes: 0,
								seconds: 0,
								milliseconds: 0,
							}
						);
						if (lastNotificationDate) {
							const daysSinceLastNotification = differenceInDays(
								Date.now(),
								lastNotificationDate
							);
							if (daysSinceLastNotification < 3) {
								console.log(
									'Already received a notification for this withing 3 days'
								);
								return undefined;
							}
						}

						// Check if there are new messages in the chat since last check
						const chatSnap = await db.doc(`${Endpoints.Chats}/${user?.domain}`).get();
						const chat = chatSnap.data();
						const lastCheckTimestamp = Timestamp.fromDate(lastCheck);
						const newMessagesSinceLastCheck = !!chat?.messages.find(
							(msg) => msg.createdAt > lastCheckTimestamp
						);
						if (!newMessagesSinceLastCheck) {
							return undefined;
						}

						// Update the last notification timestamp for the user
						await userRef.set(
							{
								last_notifications: {
									new_messages: admin.firestore.FieldValue.serverTimestamp(),
								},
							},
							{ merge: true }
						);

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

export const onMemberCreated = functions
	.runWith({ timeoutSeconds: 90 })
	.firestore.document(`/rooms/{domain}/members/{memberUid}`)
	.onCreate(async (snapshot, context) => {
		const memberDomain = context.params.domain;
		// TODO: testing only
		if (memberDomain !== 'job-tunnel.com') {
			return undefined;
		}
		const member = snapshot.data();
		const memberUid = context.params.memberUid;
		const user$: Observable<any> = fromDocRef(db.doc(`${Endpoints.Users}/${memberUid}`));

		console.log('Initial nickname : ' + member.nickname);

		return user$
			.pipe(
				map((user) => user.nickname),
				filter((nickname: string) => !!nickname && nickname !== member.nickname),
				take(1),
				timeoutWith(60000, of(member.nickname))
			)
			.toPromise()
			.then(async (finalNickname) => {
				console.log('Final nickname : ' + finalNickname);
				const usersSnap = await db
					.collection(`${Endpoints.Users}`)
					.where('domain', '==', memberDomain)
					.where('notifications_settings.new_members', '==', true)
					.get();

				const registrationTokens = usersSnap.docs
					.map((userSnap): string | undefined => {
						// Exclude the created member
						if (userSnap.id === memberUid) {
							return undefined;
						}
						console.log(userSnap.data()?.nickname);
						return userSnap.data()?.notifications_settings?.token;
					})
					// tslint:disable-next-line:readonly-array
					.filter((token) => !!token) as Array<string>;

				// When there is no notification to send
				if (registrationTokens.length === 0) {
					return {
						expected: 0,
						sent: 0,
					};
				}

				const generateNotificationTitle = (nickname: string, domain: string): string => {
					const templatePool: ReadonlyArray<string> = [
						`${nickname} a rejoint le salon ${domain} ! 👏`,
						`Il est des nôtres ! ${nickname} fait maintenant partie du salon`,
						`Du sang frais 🧛 : accueillons ${nickname} dans le salon`,
						`Nouvelle recrue : ${nickname} au rapport 🪖`,
						`Tout le monde l'attendait, il est là : ${nickname} a rejoint le salon`,
						`Nouveau membre ! Hourra pour ${nickname} 🙌`,
						`La salon s'agrandit avec l'arrivée de ${nickname} 🚀`,
					];
					return templatePool[randomIntFromInterval(0, templatePool.length - 1)];
				};
				const notification: Notification = {
					title: generateNotificationTitle(finalNickname, memberDomain),
					body: `Venez lui dire bonjour !`,
				};

				const message: MulticastMessage = {
					notification,
					tokens: registrationTokens,
				};

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
	});
