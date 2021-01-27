export const GLOBAL_CONFIG = {
	launch_date: new Date(2021, 1, 1),
	auth: {
		minPasswordLength: 6,
	},
	chat: {
		purgeIntervalDays: 7,
		groupMessagesWithinMinutes: 5,
		timeout: {
			checkInterval: 60000,
			intervalCount: 5,
		},
		hideLastReadMessageAfterStickToBottomDelay: 10000,
		maxMessageCharCount: 700,
	},
	vibration: {
		default: [20],
		soft: [10],
		normal: [20],
		strong: [50],
		error: [25, 50, 25],
	},
	virtualKeyboardDetectionPct: 20,
};
