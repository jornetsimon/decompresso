import { Message } from '@model/message';
import { Timestamp } from '@utilities/timestamp';

export interface Report {
	author: string;
	message: Message;
	createdAt: Timestamp;
}
