import { FeedEntry } from './feed-entry';

export interface SystemFeedEntry extends FeedEntry<'system'> {
	content: string;
	color: string;
	icon?: string;
}
