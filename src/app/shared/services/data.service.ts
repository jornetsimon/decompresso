import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '@model/user';
import { Room } from '@model/room';

export enum Endpoints {
	Users = '/users',
	UserPersonalData = '/user_personal_data',
	Rooms = '/rooms',
	RoomMembers = 'members',
}
export enum Buckets {}

/**
 * Database layer
 *
 * Stores endpoints, references and streams from the database
 */
@Injectable({
	providedIn: 'root',
})
export class DataService {
	userDoc(uid: string) {
		return this.afs.collection(Endpoints.Users).doc<User>(uid);
	}
	roomDoc(uid: string) {
		return this.afs.collection(Endpoints.Rooms).doc<Room>(uid);
	}
	constructor(private afs: AngularFirestore) {}

	user$(uid: string) {
		return this.userDoc(uid).valueChanges();
	}
	room$(domain: string) {
		return this.roomDoc(domain).valueChanges();
	}
}
