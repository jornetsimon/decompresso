import { db } from './init';
import { Endpoints } from './index';
import { nicknamePool, shuffleArray } from './nickname';
import * as functions from 'firebase-functions';
import EmailSender from './mail';
import * as admin from 'firebase-admin';
import { Observable, of } from 'rxjs';
import { map, skip, take, timeoutWith } from 'rxjs/operators';
import { fromDocRef, randomIntFromInterval } from './utilities';
import { messaging } from 'firebase-admin/lib/messaging';
import FieldValue = admin.firestore.FieldValue;
import MulticastMessage = messaging.MulticastMessage;
import Notification = messaging.Notification;

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

export const onMemberCreated = functions.firestore
	.document(`/rooms/{domain}/members/{memberUid}`)
	.onCreate(async (snapshot, context) => {
		const memberDomain = context.params.domain;
		const member = snapshot.data();
		const memberUid = context.params.memberUid;
		const user$: Observable<any> = fromDocRef(db.doc(`${Endpoints.Users}/${memberUid}`));

		console.log('Initial nickname : ' + member.nickname);

		return user$
			.pipe(
				map((user) => user.nickname),
				skip(1),
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
