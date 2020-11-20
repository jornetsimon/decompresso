import { Timestamp } from '@utilities/timestamp';

export interface Message {
	uid: string;
	createdAt: Timestamp;
	author: string;
	content: string;
}
