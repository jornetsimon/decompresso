import { createUser, deleteUser } from './auth';
import { onReportCreated, onReportModified, purgeChat, sliceMessages } from './chat';
import { changeNickname, getNicknamesSample } from './nickname';
import { invite } from './room';
import {
	onMemberCreated,
	sendNewMessagesNotification,
	setUserNotificationSettings,
} from './notifications';

export enum Endpoints {
	Users = '/users',
	UserPersonalData = '/user_personal_data',
	PublicEmailDomains = '/public_email_domains',
	Rooms = '/rooms',
	RoomMembers = 'members',
	Chats = '/chats',
	Stats = '/stats',
	Reading = '/reading',
}

exports.createUser = createUser;
exports.deleteUser = deleteUser;
exports.sliceMessages = sliceMessages;
exports.purgeChat = purgeChat;
exports.onReportCreated = onReportCreated;
exports.onReportModified = onReportModified;
exports.nicknamesSample = getNicknamesSample;
exports.changeNickname = changeNickname;
exports.invite = invite;
exports.sendNewMessagesNotification = sendNewMessagesNotification;
exports.setUserNotificationSettings = setUserNotificationSettings;
exports.onMemberCreated = onMemberCreated;
