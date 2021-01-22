import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SigninComponent } from './signin/signin.component';
import { fromEvent } from 'rxjs';
import { debounceTime, first } from 'rxjs/operators';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AngularFireAnalytics } from '@angular/fire/analytics';

@Component({
	selector: 'mas-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
	constructor(
		private modalService: NzModalService,
		private breakpointObserver: BreakpointObserver,
		private analytics: AngularFireAnalytics
	) {}

	openSigninModal() {
		this.analytics.logEvent('signup_modal_opened');
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
