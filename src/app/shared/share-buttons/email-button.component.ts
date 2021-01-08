import { Component } from '@angular/core';

@Component({
	selector: 'mas-email-button',
	template: `<mas-share-button
		service="email"
		icon="mail"
		iconTheme="fill"
		tooltipText="Partager par email"
	></mas-share-button>`,
	styles: [],
})
export class EmailButtonComponent {}
