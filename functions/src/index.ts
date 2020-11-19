import { createUser, deleteUser } from './auth';

export enum Endpoints {
	Users = '/users',
	UserPersonalData = '/user_personal_data',
	PublicEmailDomains = '/public_email_domains',
	Rooms = '/rooms',
	RoomMembers = 'members',
	Chats = '/chats',
}

exports.createUser = createUser;
exports.deleteUser = deleteUser;
