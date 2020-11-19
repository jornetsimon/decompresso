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
import { combineLatest } from 'rxjs';
import { map, share } from 'rxjs/operators';
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
	constructor(
		private chatService: ChatService,
		private roomService: RoomService,
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
	}

	ngAfterViewInit() {
		this.newMessageInputRef.nativeElement.focus();
	}
	ngAfterViewChecked() {
		console.log('view checked');
		this.scrollToBottomOfChat();
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
