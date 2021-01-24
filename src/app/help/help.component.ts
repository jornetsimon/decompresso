import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';

@Component({
	selector: 'mas-help',
	templateUrl: './help.component.html',
	styleUrls: ['./help.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpComponent implements AfterViewInit {
	isTouchDevice = this.deviceDetectorService.isMobile() || this.deviceDetectorService.isTablet();
	constructor(
		private deviceDetectorService: DeviceDetectorService,
		private route: ActivatedRoute
	) {}

	ngAfterViewInit() {
		this.route.fragment.pipe(first()).subscribe((fragment) => {
			if (fragment) {
				(document.querySelector(`#${fragment}`) as HTMLElement).classList.add('target');
			}
		});
	}
}
