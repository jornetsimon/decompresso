import { Component } from '@angular/core';

@Component({
	selector: 'mas-whatsapp-button',
	template: ` <mas-share-button
		service="whatsapp"
		icon="whats-app"
		tooltipText="Partager dans WhatsApp"
	></mas-share-button>`,
	styles: [],
})
export class WhatsappButtonComponent {}
