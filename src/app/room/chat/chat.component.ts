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
import { ChatService } from './chat.service';
import { combineLatest, fromEvent, Observable, Subject } from 'rxjs';
import {
	distinctUntilChanged,
	filter,
	map,
	share,
	startWith,
	tap,
	withLatestFrom,
} from 'rxjs/operators';
import { UserService } from '@services/user.service';
import { scrollParentToChild } from '@utilities/scroll-parent-to-child';
import { Message } from '@model/message';
import { MessageGroup } from '@model/message-group';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
	selector: 'mas-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent implements AfterViewInit {
	@ViewChild('chatContent') chatContentRef: ElementRef<HTMLDivElement>;
	private chatContentResizedSubject = new Subject<number>();
	chatContentResized$ = this.chatContentResizedSubject.asObservable();
	@ViewChild('newMessageInput') newMessageInputRef: ElementRef<HTMLDivElement>;
	loadCount = 0;
	roomHasMultipleMembers$ = this.roomService.members$.pipe(map((members) => members.length >= 2));
	groupedMessages$ = combineLatest([
		this.roomService.messages$,
		this.roomService.members$,
		this.userService.userUid$,
	]).pipe(
		map(([messages, members, userUid]) => {
			return messages
				.reduce(ChatService.groupMessagesByDateAndAuthor, [])
				.map((messageGroup, index) => {
					return {
						...messageGroup,
						authorUser: members.find((m) => m.uid === messageGroup.author),
						isMine: messageGroup.author === userUid,
						isLast: index === messages.length - 1,
						isFresh: this.loadCount !== 0,
					};
				});
		}),
		tap(() => {
			this.loadCount++;
		}),
		share()
	);

	newMessageForm = new FormGroup({
		message: new FormControl(undefined, [Validators.required]),
	});

	private chatScrollingState$: Observable<readonly [number, number, number]>;
	stickToChatBottom$: Observable<boolean>;
	trackByMessageGroupFn: TrackByFunction<MessageGroup & any> = (index, item) =>
		item.timestamp.seconds + item.author;
	trackByMessageFn: TrackByFunction<Message & any> = (index, item) => item.uid;

	constructor(
		private chatService: ChatService,
		public roomService: RoomService,
		private userService: UserService
	) {}

	ngAfterViewInit() {
		// Focus the new message input
		this.newMessageInputRef.nativeElement.focus();

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

		this.stickToChatBottom$ = this.chatScrollingState$.pipe(
			map(([current, max, percent]) => max - current <= 50),
			distinctUntilChanged(),
			startWith(true)
		);

		// Observe the chat content element and update a subject with the new scrollHeight
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
			.subscribe(() => {
				// scroll to the bottom
				this.scrollToBottomOfChat(this.loadCount > 1 ? 'smooth' : 'auto');
			});
	}

	scrollToMessage(messageElement: Element) {
		scrollParentToChild(this.chatContentRef.nativeElement, messageElement);
	}

	scrollToBottomOfChat(behavior?: ScrollBehavior) {
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
		this.chatService.sendMessage(content).then(() => {
			this.newMessageForm.reset();
			this.scrollToBottomOfChat('auto');
		});
	}

	/**
	 * Determines is a string consists of only emojis
	 */
	containsOnlyEmojis(text: string) {
		const onlyEmojis = text.replace(new RegExp('[\u0000-\u1eeff]', 'g'), '');
		const visibleChars = text.replace(new RegExp('[\n\rs]+|( )+', 'g'), '');
		return onlyEmojis.length === visibleChars.length;
	}
}
