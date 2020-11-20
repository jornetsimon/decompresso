export type ReactionType = 'like' | 'dislike';

export interface Reaction {
	message: string;
	user: string;
	type: ReactionType;
}
