import { Component } from '@angular/core';

@Component({
	selector: 'mas-facebook-button',
	template: `<mas-share-button
		service="facebook"
		iconTheme="fill"
		tooltipText="Partager sur Facebook"
	></mas-share-button> `,
	styles: [],
})
export class FacebookButtonComponent {}
