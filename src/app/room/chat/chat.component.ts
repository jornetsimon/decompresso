import {
	AfterViewChecked,
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	ViewChild,
} from '@angular/core';
import { RoomService } from '@services/room.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ChatService } from './chat.service';
import { combineLatest, fromEvent, Observable, Subject } from 'rxjs';
import { debounceTime, first, map, pairwise, share, startWith } from 'rxjs/operators';
import { UserService } from '@services/user.service';
import { scrollParentToChild } from '@utilities/scroll-parent-to-child';

@Component({
	selector: 'mas-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent implements AfterViewInit, AfterViewChecked {
	@ViewChild('chatContent') chatContentRef: ElementRef<HTMLDivElement>;
	@ViewChild('newMessageInput') newMessageInputRef: ElementRef<HTMLDivElement>;
	isUserAlone$ = this.roomService.members$.pipe(map((members) => members.length < 2));
	messagesWithUsers$ = combineLatest([
		this.roomService.messages$,
		this.roomService.members$,
		this.userService.userUid$,
	]).pipe(
		map(([messages, members, userUid]) => {
			return messages.map((message, index) => {
				return {
					...message,
					authorUser: members.find((m) => m.uid === message.author),
					isMine: message.author === userUid,
					isLast: index === messages.length - 1,
				};
			});
		}),
		share()
	);
	newMessageForm = new FormGroup({
		message: new FormControl(undefined, [Validators.required]),
	});
	private contentCheckedSubject = new Subject<void>();
	/**
	 * Hooks onto AfterViewChecked
	 */
	private contentChecked$ = this.contentCheckedSubject.asObservable();

	private chatScrollingState$: Observable<readonly [number, number, number]>;
	stickToChatBottom$: Observable<boolean>;
	constructor(
		private chatService: ChatService,
		public roomService: RoomService,
		private userService: UserService
	) {
		/*const lastMessageRendered$ = of(document.getElementsByClassName('is-last')).pipe(
			map((elements) => {
				if (!elements.length) {
					throw new Error('not_found');
				}
				return elements[0];
			}),
			retryWhen((error) => error.pipe(delay(200), take(100)))
		);
		// Wait for the last message to be rendered and then scroll to the bottom of the chat
		lastMessageRendered$.subscribe((element) => this.scrollToMessage(element));*/

		// Wait for the chat content to be rendered and stable to scroll to the bottom of the chat
		this.contentChecked$
			.pipe(
				map(() => this.chatContentRef?.nativeElement?.scrollHeight),
				pairwise(),
				debounceTime(500),
				first(([previous, current]) => previous < current)
			)
			.subscribe(() => {
				this.scrollToBottomOfChat();
			});
	}

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
			map(([current, max, percent]) => max - current <= 20),
			startWith(true)
		);
	}
	ngAfterViewChecked() {
		this.contentCheckedSubject.next();
	}

	scrollToMessage(messageElement: Element) {
		scrollParentToChild(this.chatContentRef.nativeElement, messageElement);
	}

	scrollToBottomOfChat() {
		this.chatContentRef.nativeElement.scrollTop = this.chatContentRef.nativeElement.scrollHeight;
	}

	sendMessage() {
		const content = this.newMessageForm.value.message.trim();
		if (!content) {
			return;
		}
		this.chatService.sendMessage(content).then(() => {
			this.newMessageForm.reset();
			this.scrollToBottomOfChat();
		});
	}
}
