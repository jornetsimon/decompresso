import { Message } from '@model/message';
import { ReactionType } from '@model/reaction';
import { MessageReactions } from './message-reactions';

export type MappedMessage = Message & {
	reactions: MessageReactions;
	myReactions: Partial<Record<ReactionType, boolean>>;
};
