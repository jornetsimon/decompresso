import { createUser, deleteUser } from './auth';
import { onReportCreated, onReportModified, purgeChat, sliceMessages } from './chat';

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
exports.sliceMessages = sliceMessages;
exports.purgeChat = purgeChat;
exports.onReportCreated = onReportCreated;
exports.onReportModified = onReportModified;
