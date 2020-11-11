import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RoughAnnotationConfig } from 'rough-notation/lib/model';

@Component({
	selector: 'mas-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
	headlineAnnotationConfig: Partial<RoughAnnotationConfig & { animationDelay: number }> = {
		type: 'underline',
		animationDelay: 1000,
		animationDuration: 1500,
		padding: 5,
		multiline: true,
	};
	anonAnnotationConfig: Partial<RoughAnnotationConfig & { animationDelay: number }> = {
		color: '#fdfd96',
		animationDelay: 3000,
		iterations: 2,
		strokeWidth: 1,
		padding: [0, 2],
	};

	constructor() {}
}
