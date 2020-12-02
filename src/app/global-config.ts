export const GLOBAL_CONFIG = {
	auth: {
		minPasswordLength: 6,
	},
	chat: {
		groupMessagesWithinMinutes: 5,
		timeout: {
			checkInterval: 60000,
			intervalCount: 5,
		},
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
