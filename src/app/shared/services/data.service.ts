import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../model/user';

export enum Endpoints {
	Users = '/users',
	UserPersonalData = '/user_personal_data',
}
export enum Buckets {}

@Injectable({
	providedIn: 'root',
})
export class DataService {
	userDoc(uid: string) {
		return this.afs.collection(Endpoints.Users).doc<User>(uid);
	}
	constructor(private afs: AngularFirestore) {}

	user$(uid: string) {
		return this.userDoc(uid).valueChanges();
	}
}
