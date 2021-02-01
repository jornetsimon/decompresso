import { Timestamp } from '@utilities/timestamp';

export interface Room {
	domain: string;
	member_count: number;
	nickname_pool: ReadonlyArray<string>;
	remaining_invites: number;
	createdAt: Timestamp;
}
