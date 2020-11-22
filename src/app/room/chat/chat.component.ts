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
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DeviceDetectorService } from 'ngx-device-detector';
import { MessageFeedEntry } from './model';

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

	trackByFeedEntryFn: TrackByFunction<MessageFeedEntry> = (index, item) =>
		item.timestamp.seconds + item.author;

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
}
