import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/functions';

@Injectable({
	providedIn: 'root',
})
export class InvitationsService {
	constructor(private fns: AngularFireFunctions) {}

	sendInvitation(email: string) {
		const callable = this.fns.httpsCallable('invite');
		return callable({ email });
	}
}
