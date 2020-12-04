import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	Input,
	ViewChild,
} from '@angular/core';
import { ChatService } from '../../chat.service';
import { Message } from '@model/message';
import { Reaction, ReactionType } from '@model/reaction';
import { fromEvent, merge, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { UserService } from '@services/user.service';
import { MappedMessage } from '../../model';
import { GLOBAL_CONFIG } from '../../../../global-config';

@Component({
	selector: 'mas-message',
	templateUrl: './message.component.html',
	styleUrls: ['./message.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageComponent implements AfterViewInit {
	@Input() message: MappedMessage;
	@Input() isFresh: boolean;
	@Input() isMine: boolean;
	@Input() color: string | undefined;

	@ViewChild('bubble') bubbleRef: ElementRef<HTMLDivElement>;

	vibrationConfig = GLOBAL_CONFIG.vibration;
	highlightForDeletion: boolean;
	showReactionsPopover$: Observable<boolean>;
	constructor(private chatService: ChatService, private userService: UserService) {}

	ngAfterViewInit() {
		this.showReactionsPopover$ = merge(
			fromEvent(this.bubbleRef.nativeElement, 'mouseenter').pipe(map(() => true)),
			fromEvent(this.bubbleRef.nativeElement, 'mouseleave').pipe(map(() => false)),
			fromEvent(document.getElementById('chat-content')!, 'scroll').pipe(map(() => false))
		).pipe(distinctUntilChanged());
	}

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

	delete() {
		this.chatService.deleteMessage(this.message);
	}

	onDeletePopoverToggle(shown: boolean) {
		this.highlightForDeletion = shown;
	}

	renderedContent(content: string) {
		return content.replace(
			this.chatService.mentionRegex,
			(match) => `<span class="mention">${match.trim()}</span>`
		);
	}
}
