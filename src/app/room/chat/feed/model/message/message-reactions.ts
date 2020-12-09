import { Reaction, ReactionType } from '@model/reaction';

export type MessageReactions = Partial<
	Record<ReactionType, ReadonlyArray<Reaction & { nickname: string }>>
>;
