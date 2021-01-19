import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
	selector: 'mas-help',
	templateUrl: './help.component.html',
	styleUrls: ['./help.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpComponent {
	isTouchDevice = this.deviceDetectorService.isMobile() || this.deviceDetectorService.isTablet();
	constructor(private deviceDetectorService: DeviceDetectorService) {}
}
