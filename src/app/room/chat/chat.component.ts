import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	TrackByFunction,
	ViewChild,
} from '@angular/core';
import { RoomService } from '@services/room.service';
import { ChatService } from './chat.service';
import { combineLatest, fromEvent, merge, Observable, of, Subject } from 'rxjs';
import {
	debounceTime,
	delay,
	distinctUntilChanged,
	filter,
	map,
	skip,
	startWith,
	take,
	takeWhile,
	withLatestFrom,
} from 'rxjs/operators';
import { scrollParentToChild } from '@utilities/scroll-parent-to-child';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MessageFeedEntry } from './model';
import { NotificationsService } from '@services/notifications.service';

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
	/**
	 * Emits when the height of the chat content changes
	 */
	chatContentResized$ = this.chatContentResizedSubject.asObservable();

	roomHasMultipleMembers$ = this.chatService.roomHasMultipleMembers$;
	messageFeed$ = this.chatService.messageFeed$;
	showFeedLoader$ = combineLatest([
		of(false).pipe(delay(1000)),
		this.messageFeed$
			.pipe(
				map(() => true),
				take(1)
			)
			.pipe(startWith(false)),
	]).pipe(
		map(([initial, feed]) => !feed),
		takeWhile((show) => show, true)
	);

	private chatScrollingState$: Observable<readonly [number, number, number]>;
	stickToChatBottom$: Observable<boolean>;
	showNewMessageTag$: Observable<boolean>;

	trackByFeedEntryFn: TrackByFunction<MessageFeedEntry> = (index, item) =>
		item.timestamp.seconds + item.author;

	constructor(
		private chatService: ChatService,
		private roomService: RoomService,
		private notificationsService: NotificationsService
	) {
		this.messageFeed$.subscribe(() => {
			this.notificationsService.notify();
		});
	}

	ngAfterViewInit() {
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
		).pipe(debounceTime(1000));

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
				debounceTime(200),
				withLatestFrom(this.stickToChatBottom$),
				// if the current scroll is stuck to the bottom
				filter(([scrollHeight, stickToChatBottom]) => !!stickToChatBottom),
				untilDestroyed(this)
			)
			.subscribe(() => {
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

	onNewMessageSent() {
		this.scrollToBottomOfChat('auto');
	}
}
