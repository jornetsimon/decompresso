import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	TrackByFunction,
	ViewChild,
} from '@angular/core';
import { RoomService } from '@services/room.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ChatService, MappedMessage, MessageGroup } from './chat.service';
import { fromEvent, merge, Observable, Subject } from 'rxjs';
import {
	distinctUntilChanged,
	filter,
	map,
	skip,
	startWith,
	tap,
	withLatestFrom,
} from 'rxjs/operators';
import { UserService } from '@services/user.service';
import { scrollParentToChild } from '@utilities/scroll-parent-to-child';
import { Message } from '@model/message';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Reaction, ReactionType } from '@model/reaction';
import { DeviceDetectorService } from 'ngx-device-detector';

@UntilDestroy()
@Component({
	selector: 'mas-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent implements AfterViewInit {
	@ViewChild('newMessageInput') newMessageInputRef: ElementRef<HTMLDivElement>;
	@ViewChild('chatContent') chatContentRef: ElementRef<HTMLDivElement>;
	private chatContentResizedSubject = new Subject<number>();
	/**
	 * Emits when the height of the chat content changes
	 */
	chatContentResized$ = this.chatContentResizedSubject.asObservable();

	/**
	 * Checks if there is more than two members in the room
	 */
	roomHasMultipleMembers$ = this.roomService.members$.pipe(
		map((members) => members.length >= 2),
		tap((roomHasMultipleMembers) => {
			const control = this.newMessageForm.get('message');
			if (control) {
				if (roomHasMultipleMembers) {
					control.enable();
				} else {
					control.disable();
				}
			}
		})
	);
	messageFeed$ = this.chatService.messageFeed$;
	newMessageForm = new FormGroup({
		message: new FormControl(undefined, [Validators.required]),
	});

	private chatScrollingState$: Observable<readonly [number, number, number]>;
	stickToChatBottom$: Observable<boolean>;
	showNewMessageTag$: Observable<boolean>;

	trackByMessageGroupFn: TrackByFunction<MessageGroup<MappedMessage>> = (index, item) =>
		item.timestamp.seconds + item.author;
	trackByMessageFn: TrackByFunction<MappedMessage> = (index, item) => item.uid;

	constructor(
		private chatService: ChatService,
		private roomService: RoomService,
		private userService: UserService,
		private deviceService: DeviceDetectorService
	) {}

	ngAfterViewInit() {
		// Focus the new message input, only on desktop
		if (this.deviceService.isDesktop()) {
			this.newMessageInputRef.nativeElement.focus();
		}

		/**
		 * The current scroll position of the chat content
		 */
		this.chatScrollingState$ = fromEvent(this.chatContentRef.nativeElement, 'scroll').pipe(
			map(() => {
				const current = this.chatContentRef.nativeElement.scrollTop;
				const max =
					this.chatContentRef.nativeElement.scrollHeight -
					this.chatContentRef.nativeElement.clientHeight;
				const percent = (current * 100) / max;
				return [current, max, percent];
			})
		);

		/**
		 * Determines if the scroll position in the chat is considered as stuck to bottom
		 */
		this.stickToChatBottom$ = this.chatScrollingState$.pipe(
			map(([current, max, percent]) => max - current <= 50),
			distinctUntilChanged(),
			startWith(true)
		);

		/**
		 * Determines when the "new message" tag should appear
		 */
		this.showNewMessageTag$ = merge(
			// When the messages are updated
			this.roomService.messages$.pipe(
				skip(1),
				withLatestFrom(this.stickToChatBottom$),
				// if the current scroll is NOT stuck to the bottom
				filter(([scrollHeight, stickToChatBottom]) => !stickToChatBottom),
				map(() => true)
			),
			// When stuck to bottom, make it disappear
			this.stickToChatBottom$.pipe(map(() => false))
		);

		/**
		 * Observe the chat content element and update a subject with the new scrollHeight
		 */
		new MutationObserver((entries) => {
			this.chatContentResizedSubject.next(this.chatContentRef.nativeElement.scrollHeight);
		}).observe(this.chatContentRef.nativeElement, {
			attributes: true,
			subtree: true,
		});

		// When the chat content scrollHeight changes
		this.chatContentResized$
			.pipe(
				withLatestFrom(this.stickToChatBottom$),
				// if the current scroll is stuck to the bottom
				filter(([scrollHeight, stickToChatBottom]) => !!stickToChatBottom),
				untilDestroyed(this)
			)
			.subscribe((loadCount) => {
				// scroll to the bottom
				this.scrollToBottomOfChat(this.chatService.feedLoadCount > 1 ? 'smooth' : 'auto');
			});
	}

	scrollToMessage(messageElement: Element) {
		scrollParentToChild(this.chatContentRef.nativeElement, messageElement);
	}
	scrollToBottomOfChat(behavior: ScrollBehavior = 'smooth') {
		this.chatContentRef.nativeElement.scrollTo({
			top: this.chatContentRef.nativeElement.scrollHeight,
			behavior,
		});
	}

	sendMessage() {
		const content = this.newMessageForm.value.message?.trim();
		if (!content) {
			return;
		}
		this.newMessageForm.reset();
		this.chatService.sendMessage(content).then(() => {
			this.scrollToBottomOfChat('auto');
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
}
