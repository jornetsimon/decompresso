import { Timestamp } from '@utilities/timestamp';
import { ConnectionState } from '@services/presence.service';
import { UserNotificationSettings } from '@model/user-notification-settings';
import { UserNewsletterSettings } from '@model/user-newsletter-settings';

export interface User {
	nickname: string;
	domain: string;
	createdAt: Timestamp;
	color: string;
	deleted?: boolean;
	state: ConnectionState;
	last_state_update: Timestamp;
	notifications_settings?: UserNotificationSettings;
	newsletter_settings?: UserNewsletterSettings;
	last_notifications?: {
		new_messages: Timestamp;
	};
	lock_nickname?: boolean;
}
