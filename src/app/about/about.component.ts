import { Component, OnInit } from '@angular/core';
import { TitleService } from '@services/title.service';

@Component({
	selector: 'mas-about',
	templateUrl: './about.component.html',
	styleUrls: ['./about.component.scss'],
})
export class AboutComponent implements OnInit {
	constructor(private titleService: TitleService) {}

	ngOnInit(): void {
		this.titleService.setTitle('À propos de nous');
	}
}
