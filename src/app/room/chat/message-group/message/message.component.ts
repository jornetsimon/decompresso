import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	Input,
	SecurityContext,
	ViewChild,
} from '@angular/core';
import { ChatService } from '../../chat.service';
import { Message } from '@model/message';
import { Reaction, ReactionType } from '@model/reaction';
import { fromEvent, Observable } from 'rxjs';
import { debounceTime, filter, first, map, startWith, take } from 'rxjs/operators';
import { UserService } from '@services/user.service';
import { GLOBAL_CONFIG } from '../../../../global-config';
import { getRegExp } from '@utilities/regex';
import { MappedMessage } from '../../feed/model/message/mapped-message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ReportComponent } from '../../report/report.component';
import { RoomService } from '@services/room.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { DomSanitizer } from '@angular/platform-browser';

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
	private urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/;
	vibrationConfig = GLOBAL_CONFIG.vibration;
	highlightForDeletion: boolean;
	highlightForReport: boolean;
	/**
	 * Is the message bubble currently visible in the chat
	 */
	bubbleVisibility: Observable<boolean>;

	constructor(
		private chatService: ChatService,
		private userService: UserService,
		private roomService: RoomService,
		private elRef: ElementRef,
		private modalService: NzModalService,
		private nzMessageService: NzMessageService,
		private domSanitizer: DomSanitizer
	) {}

	ngAfterViewInit() {
		this.bubbleVisibility = fromEvent(
			this.elRef.nativeElement.closest('#chat-content'),
			'scroll'
		).pipe(
			// Trigger an initial check when the component is created
			// This is useful to detect the visibility of the first messages in the feed, that don't require scrolling
			startWith(undefined),
			debounceTime(500),
			map(() => {
				const bubbleElement = this.bubbleRef.nativeElement;
				const chatContentElement: Element = this.elRef.nativeElement.closest(
					'#chat-content'
				);

				if (!(bubbleElement && chatContentElement)) {
					return false;
				}

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
	openReportModal() {
		this.roomService.members$
			.pipe(
				map((members) => members.find((m) => m.uid === this.message.author)),
				first()
			)
			.toPromise()
			.then((authorUser) => {
				const reportModal = this.modalService.create({
					nzTitle: 'Signaler un message',
					nzContent: ReportComponent,
					nzComponentParams: {
						message: {
							uid: this.message.uid,
							author: this.message.author,
							createdAt: this.message.createdAt,
							content: this.message.content,
						},
						authorUser,
					},
					nzClassName: 'report-modal',
					nzFooter: [
						{
							label: 'Annuler',
							type: 'default',
							onClick: () => reportModal.destroy(),
						},
						{
							label: 'Signaler ce message',
							type: 'primary',
							autoLoading: true,
							onClick: (component: ReportComponent) => {
								this.chatService.reportMessage(component.message).then(
									() => {
										this.nzMessageService.success('Message signalé');
									},
									(error) => {
										console.error(error);
										this.nzMessageService.error(
											`Le message n'a pas pu être signalé.<br/>Vous pouvez contacter notre support : <a href="mailto:support@decompresso.fr">support@decompresso.fr</a>.`,
											{
												nzDuration: 20000,
												nzPauseOnHover: true,
											}
										);
									}
								);
								reportModal.destroy();
							},
						},
					],
				});
			});
	}

	onDeletePopoverToggle(shown: boolean) {
		this.highlightForDeletion = shown;
	}
	onReportPopoverToggle(shown: boolean) {
		this.highlightForReport = shown;
	}

	renderedContent(content: string) {
		if (this.message.moderated) {
			return `<span class="italic">Le contenu de ce message a été modéré.</span>`;
		}
		return content
			.replace(this.mentionRegex, (match) => `<span class="mention">${match.trim()}</span>`)
			.replace(this.urlRegex, (match) => {
				const sanitizedUrl = this.domSanitizer.sanitize(SecurityContext.URL, match);
				if (sanitizedUrl?.startsWith('unsafe')) {
					return sanitizedUrl;
				}
				return `<a href="${sanitizedUrl}" target="_blank">${sanitizedUrl}</a>`;
			});
	}
}
