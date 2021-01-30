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
	first,
	map,
	skip,
	startWith,
	switchMap,
	take,
	takeWhile,
	withLatestFrom,
} from 'rxjs/operators';
import { scrollParentToChild } from '@utilities/scroll-parent-to-child';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GLOBAL_CONFIG } from '../../global-config';
import { FeedService } from './feed/feed.service';
import { FeedEntry } from './feed/model/feed-entry';
import { isMessageFeedEntry } from './feed/model/message.feed-entry';

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
	feed$ = this.feedService.feed$;
	showFeedLoader$ = merge(
		of(false).pipe(delay(1000)),
		this.feed$
			.pipe(
				map(() => true),
				take(1)
			)
			.pipe(startWith(false))
	).pipe(
		map((x) => !x),
		takeWhile((show) => show, true)
	);

	private chatScrollingState$: Observable<readonly [number, number, number]>;
	stickToChatBottom$: Observable<boolean>;
	showNewMessageTag$: Observable<boolean>;
	showLastReadMessageBar$: Observable<boolean>;

	trackByFeedEntryFn: TrackByFunction<FeedEntry<any>> = (index, item) => {
		return item.timestamp.seconds + (isMessageFeedEntry(item) ? item.author : item.type);
	};

	constructor(
		private chatService: ChatService,
		private roomService: RoomService,
		private feedService: FeedService
	) {}

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
		 * Set to false if the user is the only member in the room
		 */
		this.stickToChatBottom$ = combineLatest([
			this.roomHasMultipleMembers$,
			this.chatScrollingState$.pipe(
				map(([current, max, percent]) => max - current <= 50),
				distinctUntilChanged(),
				startWith(true)
			),
		]).pipe(map(([multipleMembers, scrollingState]) => multipleMembers && scrollingState));

		/**
		 * Determines when the "last message bar" should be displayed
		 */
		this.showLastReadMessageBar$ = merge(
			of(true),
			this.stickToChatBottom$.pipe(
				delay(GLOBAL_CONFIG.chat.hideLastReadMessageAfterStickToBottomDelay),
				map((stick) => !stick)
			)
		).pipe(takeWhile((show) => show, true));

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
		this.feed$
			.pipe(
				switchMap((feed) =>
					combineLatest([of(feed), this.chatContentResized$.pipe(first())])
				),
				debounceTime(100),
				withLatestFrom(this.stickToChatBottom$),
				// if the current scroll is stuck to the bottom
				filter(([data, stickToChatBottom]) => !!stickToChatBottom),
				untilDestroyed(this)
			)
			.subscribe(([[feed]]) => {
				const feedHasLastReadMessageEntry = !!feed.find(
					(e) => e.type === 'last-read-message'
				);
				if (!feedHasLastReadMessageEntry) {
					this.scrollToBottomOfChat('auto');
				} else if (this.feedService.feedLoadCount > 1) {
					this.scrollToBottomOfChat('smooth');
				} else {
					this.scrollToLastMessageBar();
				}
			});
	}

	/**
	 * ⬇ Scroll the chat to the last read message bar
	 */
	scrollToLastMessageBar() {
		const lastReadMessageBarElement = document.getElementById('last-read-message-bar');
		if (lastReadMessageBarElement) {
			this.scrollToMessage(lastReadMessageBarElement);
		}
	}

	/**
	 * ⬇ Scroll the chat to a message element
	 */
	scrollToMessage(messageElement: Element) {
		scrollParentToChild(this.chatContentRef.nativeElement, messageElement);
	}

	/**
	 * ⬇ Scroll to the bottom of the chat
	 */
	scrollToBottomOfChat(behavior: ScrollBehavior = 'smooth') {
		this.chatContentRef.nativeElement.scrollTo({
			top: this.chatContentRef.nativeElement.scrollHeight,
			behavior,
		});
	}

	onNewMessageSent() {
		// When a message is sent, scroll to the bottom of the chat
		this.scrollToBottomOfChat('auto');
	}
}
