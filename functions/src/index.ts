import { createUser, deleteUser } from './auth';
import { onUserStatusChanged } from './presence';
import { purgeChat, sliceMessages } from './chat';

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
exports.userConnectionStatusSync = onUserStatusChanged;
exports.sliceMessages = sliceMessages;
exports.purgeChat = purgeChat;
