import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RoughAnnotationConfig } from 'rough-notation/lib/model';

@Component({
	selector: 'mas-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
	headlineAnnotationConfig: Partial<RoughAnnotationConfig & { animationDelay: number }> = {
		type: 'underline',
		animationDelay: 1000,
		animationDuration: 1500,
		padding: 0,
	};
	anonAnnotationConfig: Partial<RoughAnnotationConfig & { animationDelay: number }> = {
		color: '#fdfd96',
		animationDelay: 3000,
		iterations: 2,
		strokeWidth: 1,
		padding: [0, 2],
	};

	constructor() {}

	ngOnInit(): void {}
}
