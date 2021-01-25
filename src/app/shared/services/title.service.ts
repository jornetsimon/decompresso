import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Injectable({
	providedIn: 'root',
})
export class TitleService {
	private readonly appName = 'Décompresso';
	constructor(private title: Title) {}

	getTitle() {
		return this.title.getTitle();
	}
	setTitle(title: string, includeAppName = true) {
		this.title.setTitle(`${includeAppName ? this.appName + ' - ' : ''}${title}`);
	}
}
