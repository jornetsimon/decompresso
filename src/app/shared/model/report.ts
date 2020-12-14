import { Message } from '@model/message';
import { Timestamp } from '@utilities/timestamp';
import { RoomMember } from '@model/room-member';

export interface Report {
	report_author: RoomMember;
	message: Message;
	message_author: RoomMember;
	createdAt: Timestamp;
	moderation: ModerationType;
}

export type ModerationType = 'moderate' | 'leave' | 'pending';
