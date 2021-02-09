export interface UserNotificationSettings {
	new_messages: boolean;
	new_members: boolean;
	tokens: ReadonlyArray<string>;
}
