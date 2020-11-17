import { Timestamp } from '@utilities/timestamp';

export interface User {
	nickname: string;
	domain: string;
	createdAt: Timestamp;
	color: string;
	deleted?: boolean;
}
