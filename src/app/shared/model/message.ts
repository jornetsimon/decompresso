import { Timestamp } from '@utilities/timestamp';

export interface Message {
	uid: string;
	createdAt: Timestamp;
	author: string;
	content: string;
	reactions: {
		likes: ReadonlyArray<string>;
		dislikes: ReadonlyArray<string>;
	};
}
