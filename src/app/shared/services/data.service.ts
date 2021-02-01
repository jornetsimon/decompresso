import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '@model/user';
import { Room } from '@model/room';
import { UserPersonalData } from '@model/user-personal-data';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Chat } from '@model/chat';
import { RoomMember } from '@model/room-member';
import { Report } from '@model/report';
import { FirestoreTrackerService } from '@services/firestore/firestore-tracker.service';
import { Reading } from '@model/reading';

export enum Endpoints {
	Users = '/users',
	UserPersonalData = '/user_personal_data',
	Reading = '/reading',
	Rooms = '/rooms',
	RoomMembers = 'members',
	Reports = 'reports',
	Chats = '/chats',
}
export enum Buckets {}

/**
 * Expect data from stream
 *
 * RxJS pipeable operator throwing if no data is returned
 */
export function expectData<T>(source: Observable<T | undefined>): Observable<T> {
	return source.pipe(
		map((data) => {
			if (!data) {
				throw new Error('data_expected_but_not_found');
			}
			return data;
		})
	);
}

/**
 * Database layer
 *
 * Stores endpoints, references and streams from the database
 */
@Injectable({
	providedIn: 'root',
})
export class DataService {
	constructor(private afs: AngularFirestore, private tracker: FirestoreTrackerService) {}

	userDoc(uid: string) {
		return this.afs.collection<User>(Endpoints.Users).doc(uid);
	}
	userPersonalDataDoc(uid: string) {
		return this.afs.collection<UserPersonalData>(Endpoints.UserPersonalData).doc(uid);
	}
	userReadingDoc(uid: string) {
		return this.afs.collection<Reading>(Endpoints.Reading).doc(uid);
	}
	roomDoc(uid: string) {
		return this.afs.collection<Room>(Endpoints.Rooms).doc(uid);
	}
	roomMembersCol(domain: string) {
		return this.afs.collection<RoomMember>(
			`${Endpoints.Rooms}/${domain}/${Endpoints.RoomMembers}`
		);
	}
	roomMemberDoc(domain: string, uid: string) {
		return this.afs.doc<RoomMember>(
			`${Endpoints.Rooms}/${domain}/${Endpoints.RoomMembers}/${uid}`
		);
	}
	reportsCol(domain: string) {
		return this.afs.collection<Report>(`${Endpoints.Rooms}/${domain}/${Endpoints.Reports}`);
	}
	chatDoc(uid: string) {
		return this.afs.collection<Chat>(Endpoints.Chats).doc(uid);
	}

	user$(uid: string) {
		return this.userDoc(uid).valueChanges().pipe(this.tracker.logAction('user'));
	}
	userPersonalData$(uid: string) {
		return this.userPersonalDataDoc(uid)
			.valueChanges()
			.pipe(this.tracker.logAction('user_personal_data'));
	}

	userReading$(uid: string) {
		return this.userReadingDoc(uid).valueChanges().pipe(this.tracker.logAction('reading'));
	}
	room$(domain: string) {
		return this.roomDoc(domain).valueChanges().pipe(this.tracker.logAction('room'));
	}
	roomMember$(domain: string, uid: string) {
		return this.roomMemberDoc(domain, uid)
			.valueChanges({
				idField: 'uid',
			})
			.pipe(this.tracker.logAction('member'));
	}
	roomMembers$(domain: string) {
		return this.roomMembersCol(domain)
			.valueChanges({ idField: 'uid' })
			.pipe(this.tracker.logAction('members'));
	}
	chat$(domain: string) {
		return this.chatDoc(domain).valueChanges().pipe(this.tracker.logAction('chat'));
	}
	chatSnap$(domain: string) {
		return this.chatDoc(domain)
			.snapshotChanges()
			.pipe(
				this.tracker.logAction('chat'),
				map((action) => action.payload)
			);
	}
}
