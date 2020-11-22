import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ChatService } from '../../chat.service';
import { Message } from '@model/message';
import { Reaction, ReactionType } from '@model/reaction';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService } from '@services/user.service';
import { MappedMessage } from '../../model';

@Component({
	selector: 'mas-message',
	templateUrl: './message.component.html',
	styleUrls: ['./message.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageComponent {
	@Input() message: MappedMessage;
	@Input() isFresh: boolean;
	@Input() isMine: boolean;
	@Input() color: string | undefined;
	constructor(private chatService: ChatService, private userService: UserService) {}

	toggleReaction(message: Message, reaction: ReactionType) {
		this.chatService.toggleReaction(message, reaction);
	}

	/**
	 * Determines is a string consists of only emojis
	 */
	containsOnlyEmojis(text: string) {
		const onlyEmojis = text.replace(new RegExp('[\u0000-\u1eeff]', 'g'), '');
		const visibleChars = text.replace(new RegExp('[\n\rs]+|( )+', 'g'), '');
		return onlyEmojis.length === visibleChars.length;
	}

	/**
	 * Lists the nicknames of the users who put a reaction
	 */
	printReactionsNicknames(
		reactions: ReadonlyArray<Reaction & { nickname: string }>,
		maxDisplayed = 3
	): Observable<string> {
		return this.userService.userUid$.pipe(
			map((userUid) => {
				const join = reactions.reduce((str, reaction, index) => {
					if (index < maxDisplayed) {
						return (
							(str ? str + ', ' : '') +
							(reaction.user === userUid ? 'moi' : reaction.nickname)
						);
					} else {
						return str;
					}
				}, '');

				const diff = reactions.length - maxDisplayed;
				if (reactions.length >= maxDisplayed && diff > 0) {
					return `${join} et ${diff} autre${diff > 1 ? 's' : ''}`;
				}
				return join;
			})
		);
	}
}
