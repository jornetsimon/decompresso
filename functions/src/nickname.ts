import { db } from './init';
import { Endpoints } from './index';
import * as admin from 'firebase-admin';
import FieldValue = admin.firestore.FieldValue;

export async function pickNickname(domain: string) {
	const docRef = db.doc(`${Endpoints.Rooms}/${domain}`);

	return db.runTransaction(async (transaction) => {
		const documentSnap = await transaction.get(docRef);
		const documentData = documentSnap.data();
		if (!documentData) {
			throw new Error('no_data_in_document');
		}
		const pool: ReadonlyArray<string> | undefined = documentData.nickname_pool;
		if (!pool?.length) {
			throw new Error('no_available_nickname');
		}
		const nickname = pool[0];
		transaction.update(docRef, {
			nickname_pool: FieldValue.arrayRemove(nickname),
		});
		return nickname;
	});
}

export const nicknamePool: ReadonlyArray<string> = [
	'FidèleCastor',
	'BrebisÉgarée',
	'JambonFumé',
	'MargueriteÉpanouie',
	'ChaiseBancale',
	'PandaÉpuisé',
];

export function shuffleArray(inputArray) {
	// tslint:disable-next-line:readonly-array
	const array = [...inputArray];
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}
