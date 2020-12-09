import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { SystemFeedEntry } from '../feed/model/system.feed-entry';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
	selector: 'mas-system',
	templateUrl: './system.component.html',
	styleUrls: ['./system.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemComponent {
	@Input() entry: SystemFeedEntry;
	@HostBinding('attr.style')
	public get valueAsStyle(): any {
		return this.sanitizer.bypassSecurityTrustStyle(`--color: ${this.entry.color}`);
	}
	constructor(private sanitizer: DomSanitizer) {}
}
