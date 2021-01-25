import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { TitleService } from '@services/title.service';

@Component({
	selector: 'mas-cgu',
	templateUrl: './cgu.component.html',
	styleUrls: ['./cgu.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CguComponent implements OnInit {
	constructor(private titleService: TitleService) {}

	ngOnInit() {
		this.titleService.setTitle('CGU');
	}
}
