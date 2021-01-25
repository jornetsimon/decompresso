import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { TitleService } from '@services/title.service';

@Component({
	selector: 'mas-admin',
	templateUrl: './admin.component.html',
	styleUrls: ['./admin.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent implements OnInit {
	constructor(private titleService: TitleService) {}

	ngOnInit() {
		this.titleService.setTitle('Admin');
	}
}
