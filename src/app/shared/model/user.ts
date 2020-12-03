import { Timestamp } from '@utilities/timestamp';
import { ConnectionState } from '@services/presence.service';

export interface User {
	nickname: string;
	domain: string;
	createdAt: Timestamp;
	color: string;
	deleted?: boolean;
	state: ConnectionState;
	last_state_update: Timestamp;
}
