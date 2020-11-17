import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RoughAnnotationConfig } from 'rough-notation/lib/model';
import { LayoutService } from '../layout/layout.service';
import { delay, map, startWith, switchMap } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { combineLatest, Observable, of } from 'rxjs';

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
	showAnnotations$: Observable<boolean> = combineLatest([
		this.breakpointObserver
			.observe([Breakpoints.Handset, Breakpoints.Tablet])
			.pipe(map((state) => state.matches)),
		this.layoutService.inputFocusSubject.asObservable().pipe(
			switchMap((isFocused) => {
				if (isFocused) {
					return of(isFocused);
				} else {
					return of(isFocused).pipe(delay(500));
				}
			})
		),
	]).pipe(
		map(([isHandheld, isFocused]) => !(isHandheld && isFocused)),
		startWith(true)
	);
	constructor(
		private layoutService: LayoutService,
		private breakpointObserver: BreakpointObserver
	) {}
}
