import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	ViewChild,
} from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SigninComponent } from './signin/signin.component';
import { fromEvent, merge } from 'rxjs';
import { debounceTime, first, mapTo } from 'rxjs/operators';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ElementReadingTracker } from '@utilities/element-reading-tracker';
import { AnalyticsService } from '@analytics/analytics.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
	selector: 'mas-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements AfterViewInit {
	@ViewChild('section1') section1Ref: ElementRef<HTMLDivElement>;
	@ViewChild('section2') section2Ref: ElementRef<HTMLDivElement>;
	@ViewChild('section3') section3Ref: ElementRef<HTMLDivElement>;
	@ViewChild('section4') section4Ref: ElementRef<HTMLDivElement>;
	constructor(
		private modalService: NzModalService,
		private breakpointObserver: BreakpointObserver,
		private analyticsService: AnalyticsService
	) {}

	ngAfterViewInit(): void {
		merge(
			new ElementReadingTracker(this.section1Ref, 80).isRead$.pipe(
				first((isRead) => isRead),
				mapTo('Section 1')
			),
			new ElementReadingTracker(this.section2Ref, 80).isRead$.pipe(
				first((isRead) => isRead),
				mapTo('Section 2')
			),
			new ElementReadingTracker(this.section3Ref, 80).isRead$.pipe(
				first((isRead) => isRead),
				mapTo('Section 3')
			),
			new ElementReadingTracker(this.section4Ref, 80).isRead$.pipe(
				first((isRead) => isRead),
				mapTo('Section 4')
			)
		)
			.pipe(untilDestroyed(this))
			.subscribe((sectionName) => {
				this.analyticsService.logEvent('content_view', undefined, sectionName, undefined, {
					non_interaction: true,
					page_path: '/',
					screen_class: 'mas-home',
				});
			});
	}

	openSigninModal() {
		this.modalService.create({
			nzContent: SigninComponent,
			nzFooter: null,
			nzMaskStyle: {
				'background-color': 'rgb(0 0 0 / 38%);',
			},
			nzClassName: 'signin-modal',
			nzCloseOnNavigation: true,
		});
	}

	scrollTop() {
		if (this.breakpointObserver.isMatched('(max-width: 959px)')) {
			fromEvent(window, 'scroll')
				.pipe(debounceTime(100), first())
				.subscribe({
					complete: () => {
						this.openSigninModal();
					},
				});
		}
		window.scrollTo({
			behavior: 'smooth',
			top: 0,
		});
	}
}
