import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ShareService } from 'ngx-sharebuttons';
import { ThemeType } from '@ant-design/icons-angular';

@Component({
	selector: 'mas-share-button',
	templateUrl: './share-button.component.html',
	styleUrls: ['./share-button.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareButtonComponent implements OnChanges {
	@Input() service: string;
	@Input() icon?: string;
	@Input() iconTheme: ThemeType = 'outline';
	@Input() tooltipText: string;

	private _color: string;
	private fallbackColor: 'white';
	@Input() set color(value: string) {
		this._color = value;
	}
	get color() {
		if (this._color) {
			return this._color;
		}
		if (this.service && this.shareService.prop[this.service]) {
			return this.shareService.prop[this.service].color;
		}
		return this.fallbackColor;
	}
	constructor(public shareService: ShareService) {}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.service) {
			this.color = changes.service.currentValue
				? this.shareService.prop[changes.service.currentValue].color
				: 'white';
		}
	}
}
