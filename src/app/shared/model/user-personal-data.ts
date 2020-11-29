import { Timestamp } from '@utilities/timestamp';

export interface UserSettings {
	local_notifications?: boolean;
}
export interface UserPersonalData {
	email: string;
	deletedAt?: Timestamp;
	settings?: UserSettings;
}
