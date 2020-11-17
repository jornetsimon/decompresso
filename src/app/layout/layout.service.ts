import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class LayoutService {
	showUserDrawer: boolean;
	inputFocusSubject = new BehaviorSubject<boolean>(false);
	constructor() {}
}
