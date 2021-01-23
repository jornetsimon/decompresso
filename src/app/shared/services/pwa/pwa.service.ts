import { Injectable } from '@angular/core';
import { BeforeInstallPromptEvent } from './before-install-prompt-event';

@Injectable({
	providedIn: 'root',
})
export class PwaService {
	deferredPrompt: BeforeInstallPromptEvent;
	constructor() {}

	showPwaInstallPrompt() {
		this.deferredPrompt.prompt();
	}
}
