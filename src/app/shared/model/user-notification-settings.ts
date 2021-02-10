import { DeviceType } from 'ngx-device-detector';

export interface UserNotificationSettings {
	new_messages: boolean;
	new_members: boolean;
	tokens: Record<DeviceType, string>;
}
