import { AfterViewInit, ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { TitleService } from '@services/title.service';

@Component({
	selector: 'mas-help',
	templateUrl: './help.component.html',
	styleUrls: ['./help.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpComponent implements OnInit, AfterViewInit {
	isTouchDevice = this.deviceDetectorService.isMobile() || this.deviceDetectorService.isTablet();
	constructor(
		private deviceDetectorService: DeviceDetectorService,
		private route: ActivatedRoute,
		private titleService: TitleService
	) {}

	ngAfterViewInit() {
		this.route.fragment.pipe(first()).subscribe((fragment) => {
			if (fragment) {
				console.log(fragment, document.querySelector(`#${fragment}`));
				const el = document.querySelector(`#${fragment}`) as HTMLElement;
				setTimeout(() => {
					el.scrollIntoView({ behavior: 'smooth' });
					el.classList.add('target');
				}, 1500);
			}
		});
	}

	ngOnInit() {
		this.titleService.setTitle('FAQ');
	}
}
