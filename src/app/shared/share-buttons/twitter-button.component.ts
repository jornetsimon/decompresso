import { Component } from '@angular/core';

@Component({
	selector: 'mas-twitter-button',
	template: `<mas-share-button
		service="twitter"
		tooltipText="Partager sur Twitter"
	></mas-share-button>`,
	styles: [],
})
export class TwitterButtonComponent {}
