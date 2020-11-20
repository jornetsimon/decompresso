import { Injectable } from '@angular/core';
import { RoomService } from '@services/room.service';
import { UserService } from '@services/user.service';
import { first, switchMap } from 'rxjs/operators';
import { DataService } from '@services/data.service';
import { combineLatest } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { Message } from '@model/message';
import firebase from 'firebase/app';
import firestore = firebase.firestore;

const FieldValue = firestore.FieldValue;

@Injectable({
	providedIn: 'root',
})
export class ChatService {
	constructor(
		private roomService: RoomService,
		private userService: UserService,
		private dataService: DataService,
		private afs: AngularFirestore
	) {}

	sendMessage(content: string) {
		return combineLatest([
			this.userService.userUid$.pipe(first()),
			this.roomService.room$.pipe(first()),
		])
			.pipe(
				switchMap(([userUid, room]) => {
					const message: Omit<Message, 'createdAt'> & { createdAt: Date } = {
						uid: this.afs.createId(),
						createdAt: new Date(),
						author: userUid,
						content,
						reactions: {
							likes: [],
							dislikes: [],
						},
					};
					return this.dataService
						.chatDoc(room.domain)
						.update({ messages: FieldValue.arrayUnion(message) as any });
				})
			)
			.toPromise();
	}
}
