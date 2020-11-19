import { db } from './init';
import { Endpoints } from './index';
import { nicknamePool, shuffleArray } from './nickname';

export function createRoom(domain: string) {
	return db
		.doc(`${Endpoints.Rooms}/${domain}`)
		.create({
			domain,
			member_count: 0,
			nickname_pool: shuffleArray(nicknamePool),
		})
		.catch(() => null);
}
export function createChat(domain: string) {
	return db
		.doc(`${Endpoints.Chats}/${domain}`)
		.create({
			messages: [],
		})
		.catch(() => null);
}
