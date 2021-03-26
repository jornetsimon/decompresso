import {
	AfterViewInit,
	ChangeDetectionStrategy,
	Component,
	ElementRef,
	OnInit,
	ViewChild,
} from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SigninComponent } from './signin/signin.component';
import { fromEvent, interval, merge } from 'rxjs';
import { debounceTime, first, mapTo, switchMap } from 'rxjs/operators';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ElementReadingTracker } from '@utilities/element-reading-tracker';
import { AnalyticsService } from '@analytics/analytics.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TitleService } from '@services/title.service';
import { LanguageService } from '../transloco/language.service';
import { CookiesConsentService } from '../shared/cookies-consent/cookies-consent.service';
import { SchoolUseCaseModalComponent } from './use-cases/school-use-case-modal/school-use-case-modal.component';
import { WorkUseCaseModalComponent } from './use-cases/work-use-case-modal/work-use-case-modal.component';
import { Meta } from '@angular/platform-browser';

@UntilDestroy()
@Component({
	selector: 'mas-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, AfterViewInit {
	@ViewChild('section1') section1Ref: ElementRef<HTMLDivElement>;
	@ViewChild('section2') section2Ref: ElementRef<HTMLDivElement>;
	@ViewChild('section3') section3Ref: ElementRef<HTMLDivElement>;
	@ViewChild('section4') section4Ref: ElementRef<HTMLDivElement>;
	constructor(
		private modalService: NzModalService,
		private breakpointObserver: BreakpointObserver,
		private analyticsService: AnalyticsService,
		private titleService: TitleService,
		private meta: Meta,
		public languageService: LanguageService,
		public cookiesConsentService: CookiesConsentService
	) {}

	ngOnInit(): void {
		this.titleService.setTitle('Le chat anonyme du bureau');
		this.meta.addTags([
			{
				name: 'description',
				content:
					"Mettez du fun dans votre journée de travail en discutant incognito avec vos collègues. C'est nouveau, simple et gratuit.",
			},
			{ name: 'robots', content: 'index, follow' },
			{ name: 'language', content: 'French' },
		]);
	}

	ngAfterViewInit(): void {
		interval(1000)
			.pipe(
				first(() => !!this.section1Ref),
				switchMap(() =>
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
				),
				untilDestroyed(this)
			)
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

	openUseCaseModal(useCase: 'work' | 'school') {
		const component =
			useCase === 'school' ? SchoolUseCaseModalComponent : WorkUseCaseModalComponent;
		this.modalService.create({
			nzContent: component,
			nzFooter: null,
			nzMaskStyle: {
				'background-color': 'rgb(0 0 0 / 38%);',
			},
			nzClassName: 'use-case-modal',
			nzCloseOnNavigation: true,
		});
	}
}
