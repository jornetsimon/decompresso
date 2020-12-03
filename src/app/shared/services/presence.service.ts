import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';

type State = 'online' | 'offline';
class ConnectionState {
	last_changed = Date.now();
	constructor(public state: State) {}
}

@Injectable({
	providedIn: 'root',
})
export class PresenceService {
	isOfflineForDatabase = new ConnectionState('offline');
	isOnlineForDatabase = new ConnectionState('online');

	constructor(private auth: AngularFireAuth, private angularFireDatabase: AngularFireDatabase) {}

	private async getRef() {
		// Fetch the current user's ID from Firebase Authentication.
		const uid = (await this.auth.currentUser)?.uid;

		// Create a reference to this user's specific status node.
		// This is where we will store data about being online/offline.
		return this.angularFireDatabase.database.ref('/status/' + uid);
	}

	async trackPresence() {
		const userStatusDatabaseRef = await this.getRef();

		// Create a reference to the special '.info/connected' path in
		// Realtime Database. This path returns `true` when connected
		// and `false` when disconnected.
		this.angularFireDatabase.database.ref('.info/connected').on('value', (snapshot) => {
			// If we're not currently connected, don't do anything.
			if (snapshot.val() === false) {
				return;
			}

			// If we are currently connected, then use the 'onDisconnect()'
			// method to add a set which will only trigger once this
			// client has disconnected by closing the app,
			// losing internet, or any other means.
			userStatusDatabaseRef
				.onDisconnect()
				.set(this.isOfflineForDatabase)
				.then(() => {
					// The promise returned from .onDisconnect().set() will
					// resolve as soon as the server acknowledges the onDisconnect()
					// request, NOT once we've actually disconnected:
					// https://firebase.google.com/docs/reference/js/firebase.database.OnDisconnect

					// We can now safely set ourselves as 'online' knowing that the
					// server will mark us as offline once we lose connection.
					userStatusDatabaseRef.set(this.isOnlineForDatabase);
				});
		});
	}

	async setConnectionState(state: State) {
		console.log(`setting ${state}`);
		const userStatusDatabaseRef = await this.getRef();
		userStatusDatabaseRef.set(
			state === 'online' ? this.isOnlineForDatabase : this.isOfflineForDatabase
		);
	}
}
