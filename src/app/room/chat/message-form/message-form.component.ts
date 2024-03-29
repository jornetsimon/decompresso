import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
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
import { merge, Subject } from 'rxjs';
import { RoomService } from '@services/room.service';
import {
	delay,
	distinctUntilChanged,
	filter,
	map,
	share,
	startWith,
	tap,
	withLatestFrom,
} from 'rxjs/operators';
import { NzMentionComponent } from 'ng-zorro-antd/mention';
import { User } from '@model/user';
import { UserService } from '@services/user.service';
import { EmojiData } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { ActivityService } from '@services/activity.service';
import { AnalyticsService } from '@analytics/analytics.service';

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
	@ViewChild('mention') mention: NzMentionComponent;
	newMessageForm = new FormGroup({
		message: new FormControl(undefined, [
			Validators.required,
			Validators.maxLength(GLOBAL_CONFIG.chat.maxMessageCharCount),
		]),
	});
	vibrationConfig = GLOBAL_CONFIG.vibration;
	roomHasMultipleMembers$ = this.chatService.roomHasMultipleMembers$;
	// tslint:disable-next-line:readonly-array
	members: any = [];
	mentionSelectedSubject = new Subject<string | undefined>();
	enterOnMessageSubject = new Subject<Event>();
	canSubmitOnEnter$ = merge(
		this.mentionSelectedSubject.asObservable().pipe(map(() => false)),
		this.mentionSelectedSubject.pipe(
			delay(200),
			map(() => true)
		)
	).pipe(startWith(true));
	remainingChars$ = this.newMessageForm.get('message')!.valueChanges.pipe(
		filter((value) => value !== undefined),
		distinctUntilChanged(),
		map((value: string) => GLOBAL_CONFIG.chat.maxMessageCharCount - value?.length),
		share()
	);
	showRemainingChars$ = this.remainingChars$.pipe(map((count) => count <= 10));

	emojiMartI18n = {
		search: 'Recherche',
		emojilist: 'Liste des emojis',
		notfound: 'Aucun emoji trouvé',
		clear: 'Effacer',
		categories: {
			search: 'Résultats de recherche',
			recent: 'Récents',
			people: 'Émoticônes et personnes',
			nature: 'Animaux et nature',
			foods: 'Alimentation et boissons',
			activity: 'Activités',
			places: 'Voyages et lieux',
			objects: 'Objets',
			symbols: 'Symboles',
			flags: 'Drapeaux',
			custom: 'Personnalisé',
		},
	};

	isInactive$ = this.activityService.isActive$.pipe(map((isActive) => !isActive));
	mentionValueMappingFn = <T extends User>(value: T) => value.nickname;

	constructor(
		private chatService: ChatService,
		private roomService: RoomService,
		private userService: UserService,
		private deviceService: DeviceDetectorService,
		private activityService: ActivityService,
		private changeDetectorRef: ChangeDetectorRef,
		private analyticsService: AnalyticsService
	) {
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

		this.roomService.membersWithoutDeleted$
			.pipe(withLatestFrom(this.userService.userUid$), untilDestroyed(this))
			.subscribe(([members, userUid]) => {
				if (members) {
					this.members = [...members.filter((member) => member.uid !== userUid)];
				}
			});
	}
	ngAfterViewInit() {
		// Focus the new message input, only on desktop
		if (this.deviceService.isDesktop()) {
			this.newMessageInputRef.nativeElement.focus();
		}

		this.enterOnMessageSubject
			.asObservable()
			.pipe(
				filter(() => !(this.deviceService.isMobile() || this.deviceService.isTablet())),
				tap((event) => {
					event?.preventDefault();
				}),
				withLatestFrom(this.canSubmitOnEnter$),
				filter(([event, canSubmitOnEnter]) => canSubmitOnEnter)
			)
			.subscribe(() => {
				this.sendMessage();
			});

		this.isInactive$.subscribe((inactive) => {
			if (inactive) {
				this.analyticsService.logEvent('inactive');
			}
			this.changeDetectorRef.detectChanges();
		});
	}

	sendMessage() {
		const content = this.newMessageForm.value.message?.trim();
		if (!content || this.newMessageForm.invalid) {
			return;
		}
		this.newMessageForm.reset();
		this.chatService.sendMessage(content).then(() => {
			this.messageSent.emit();
		});
	}

	appendEmoji(emoji: EmojiData) {
		const control = this.newMessageForm.get('message');
		control?.patchValue((control?.value || '') + emoji.native);
	}
}
