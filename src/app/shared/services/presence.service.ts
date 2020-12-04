import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFirestore } from '@angular/fire/firestore';
import { ObservableStore } from '@codewithdan/observable-store';

export type ConnectionState = 'online' | 'offline';
interface ConnectionData {
	last_state_update: number;
	state: ConnectionState;
}
interface StoreState {
	connection_state: ConnectionData;
}
@Injectable({
	providedIn: 'root',
})
export class PresenceService extends ObservableStore<StoreState> {
	private connectionStateData = (state: ConnectionState): ConnectionData => {
		return {
			last_state_update: Date.now(),
			state,
		};
	};

	constructor(
		private auth: AngularFireAuth,
		private angularFireDatabase: AngularFireDatabase,
		private afs: AngularFirestore
	) {
		super({});
	}

	private async getDatabaseRef() {
		const uid = (await this.auth.currentUser)?.uid;
		if (!uid) {
			throw new Error('not_connected');
		}
		return this.angularFireDatabase.database.ref('/status/' + uid);
	}
	private async getFirestoreRef() {
		const uid = (await this.auth.currentUser)?.uid;
		if (!uid) {
			throw new Error('not_connected');
		}
		return this.afs.doc('/users/' + uid).ref;
	}

	async trackPresence() {
		const userStatusDatabaseRef = await this.getDatabaseRef();
		const userStatusFirestoreRef = await this.getFirestoreRef();

		// Create a reference to the special '.info/connected' path in
		// Realtime Database. This path returns `true` when connected
		// and `false` when disconnected.
		this.angularFireDatabase.database.ref('.info/connected').on('value', (snapshot) => {
			// If we're not currently connected, don't do anything.
			if (snapshot.val() === false) {
				// Set as offline in Firestore for local cache awareness
				userStatusFirestoreRef.update(this.connectionStateData('offline'));
				// @ts-ignore
				this.setState({ connection_state: 'offline' });
				return;
			}

			// If we are currently connected, then use the 'onDisconnect()'
			// method to add a set which will only trigger once this
			// client has disconnected by closing the app,
			// losing internet, or any other means.
			userStatusDatabaseRef
				.onDisconnect()
				.set(this.connectionStateData('offline'))
				.then(() => {
					// The promise returned from .onDisconnect().set() will
					// resolve as soon as the server acknowledges the onDisconnect()
					// request, NOT once we've actually disconnected:
					// https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect

					// We can now safely set ourselves as 'online' knowing that the
					// server will mark us as offline once we lose connection.
					userStatusDatabaseRef.set(this.connectionStateData('online'));
					userStatusFirestoreRef.update(this.connectionStateData('online')).then(() => {
						// @ts-ignore
						this.setState({ connection_state: 'online' });
					});
				});
		});
	}

	async setConnectionState(state: ConnectionState) {
		console.log(`setting ${state}`);
		const userStatusDatabaseRef = await this.getDatabaseRef();
		userStatusDatabaseRef.set(this.connectionStateData(state));
	}
}
