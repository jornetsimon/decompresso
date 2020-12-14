import * as functions from 'firebase-functions';
import { db } from './init';
import { Endpoints } from './index';
import * as admin from 'firebase-admin';
import { sendMail } from './mail';

const nodeMailer = require('nodemailer');

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

/**
 * On report creation, send an email to support
 */
export const onReportCreated = functions.firestore
	.document(`/rooms/{domain}/reports/{uid}`)
	.onCreate((snapshot, context) => {
		const data = snapshot.data();
		const domain = context.params.domain;
		const moderationUrl = `https://www.decompresso.fr/admin/reports/${
			context.params.uid
		}?domain=${encodeURIComponent(domain)}`;

		const mailOptions = {
			from: 'app@decompresso.fr',
			to: 'support@decompresso.fr',
			subject: `[Signalement] ${domain}`,
			html: `
				Domaine : ${domain}<br/>
				Signalé par : ${data.report_author.nickname} (${data.report_author.uid})<br/>
				ID du message : ${data.message.uid}<br/>
				Contenu : <blockquote>${data.message.content}</blockquote><br/>
				Auteur du message : ${data.message_author.nickname} (${data.report_author.uid})<br/>
				Date du message : ${new Date(data.message.createdAt.seconds * 1000).toLocaleString('fr-FR', {
					timeZone: 'Europe/Paris',
				})}
				<br/><br/>
				<a href="${moderationUrl}">Lien de modération</a>
			`,
		};
		return sendMail(mailOptions);
	});

export const onReportModified = functions.firestore
	.document(`/rooms/{domain}/reports/{uid}`)
	.onUpdate(async (snapshot, context) => {
		const dataBefore = snapshot.before.data();
		const dataAfter = snapshot.after.data();

		if (dataBefore.moderation === 'pending' && dataAfter.moderation === 'moderate') {
			const message = dataAfter.message;
			const messageAuthorPersonalDataSnap = await db
				.doc(`${Endpoints.UserPersonalData}/${message.author}`)
				.get();
			const messageAuthorEmail = messageAuthorPersonalDataSnap.data()?.email;

			if (!messageAuthorEmail) {
				throw new Error('no_email_associated_with_message_author');
			}

			// TODO: lien vers la page de règles
			return sendMail({
				from: 'support@decompresso.fr',
				to: messageAuthorEmail,
				subject: `[Décompresso] Modération de votre message`,
				html: `Bonjour,
				<p>Nous vous informons que l'un de vos messages a fait l'objet d'une modération : </p>
				<blockquote>${message.content}</blockquote>
				<p>Nous vous rappelons qu'à défaut du respect des <a href="#">règles de Décompresso</a>, vous pourrez faire l'objet de nouvelles modérations de contenu, qui pourront également conduire à votre exclusion du salon.</p>
				<p>Cordialement,<br/>
				L'équipe Décompresso.</p>
				`,
			});
		}
		return null;
	});
