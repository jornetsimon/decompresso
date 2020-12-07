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
import { debounceTime, distinctUntilChanged, filter, map, take } from 'rxjs/operators';
import { UserService } from '@services/user.service';
import { MappedMessage } from '../../model';
import { GLOBAL_CONFIG } from '../../../../global-config';
import { getRegExp } from '@utilities/regex';

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

	private mentionRegex = getRegExp('@');
	vibrationConfig = GLOBAL_CONFIG.vibration;
	highlightForDeletion: boolean;
	showReactionsPopover$: Observable<boolean>;
	/**
	 * Is the message bubble currently visible in the chat
	 */
	bubbleVisibility: Observable<boolean>;

	constructor(
		private chatService: ChatService,
		private userService: UserService,
		private elRef: ElementRef
	) {}

	ngAfterViewInit() {
		this.showReactionsPopover$ = merge(
			fromEvent(this.bubbleRef.nativeElement, 'mouseenter').pipe(map(() => true)),
			fromEvent(this.bubbleRef.nativeElement, 'mouseleave').pipe(map(() => false)),
			fromEvent(document.getElementById('chat-content')!, 'scroll').pipe(map(() => false))
		).pipe(distinctUntilChanged());

		this.bubbleVisibility = fromEvent(
			this.elRef.nativeElement.closest('#chat-content'),
			'scroll'
		).pipe(
			debounceTime(500),
			map(() => {
				const bubbleElement = this.bubbleRef.nativeElement;
				const chatContentElement: Element = this.elRef.nativeElement.closest(
					'#chat-content'
				);

				const bubbleRect = bubbleElement.getBoundingClientRect();
				const chatContentRect = chatContentElement.getBoundingClientRect();

				return (
					bubbleRect.top >= chatContentRect.top &&
					bubbleRect.top + bubbleRect.height <
						chatContentRect.top + chatContentRect.height
				);
			})
		);

		/**
		 * When the message visibility changes
		 */
		this.bubbleVisibility
			.pipe(
				// Only when it is visible
				filter((isVisible) => !this.isMine && isVisible),
				take(1)
			)
			.subscribe(() => {
				// Track it as read
				this.chatService.trackMessageAsRead(this.message);
			});
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
			this.mentionRegex,
			(match) => `<span class="mention">${match.trim()}</span>`
		);
	}
}
