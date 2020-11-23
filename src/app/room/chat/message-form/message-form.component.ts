import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	EventEmitter,
	Output,
	ViewChild,
} from '@angular/core';
import { GLOBAL_CONFIG } from '../../../global-config';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ChatService } from '../chat.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DeviceDetectorService } from 'ngx-device-detector';

@UntilDestroy()
@Component({
	selector: 'mas-message-form',
	templateUrl: './message-form.component.html',
	styleUrls: ['./message-form.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageFormComponent implements AfterViewInit {
	@Output() messageSent = new EventEmitter<void>();
	@ViewChild('newMessageInput') newMessageInputRef: ElementRef<HTMLDivElement>;
	newMessageForm = new FormGroup({
		message: new FormControl(undefined, [Validators.required]),
	});
	vibrationConfig = GLOBAL_CONFIG.vibration;
	roomHasMultipleMembers$ = this.chatService.roomHasMultipleMembers$;

	constructor(private chatService: ChatService, private deviceService: DeviceDetectorService) {
		this.roomHasMultipleMembers$
			.pipe(untilDestroyed(this))
			.subscribe((roomHasMultipleMembers) => {
				const control = this.newMessageForm.get('message');
				if (control) {
					if (roomHasMultipleMembers) {
						control.enable();
					} else {
						control.disable();
					}
				}
			});
	}
	ngAfterViewInit() {
		// Focus the new message input, only on desktop
		if (this.deviceService.isDesktop()) {
			this.newMessageInputRef.nativeElement.focus();
		}
	}

	sendMessage() {
		const content = this.newMessageForm.value.message?.trim();
		if (!content) {
			return;
		}
		this.newMessageForm.reset();
		this.chatService.sendMessage(content).then(() => {
			this.messageSent.emit();
		});
	}

	onEnter(event: Event) {
		if (this.deviceService.isMobile() || this.deviceService.isTablet()) {
			return;
		}
		event.preventDefault();
		this.sendMessage();
	}
}
