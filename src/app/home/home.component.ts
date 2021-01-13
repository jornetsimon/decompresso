import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SigninComponent } from './signin/signin.component';

@Component({
	selector: 'mas-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
	constructor(private modalService: NzModalService) {}

	openSigninModal(type: 'login' | 'signup') {
		const modal = this.modalService.create({
			nzContent: SigninComponent,
			nzFooter: null,
			nzMaskStyle: {
				'background-color': 'rgb(0 0 0 / 38%);',
			},
			nzClassName: 'signin-modal',
		});
	}

	scrollTop() {
		window.scrollTo({
			behavior: 'smooth',
			top: 0,
		});
	}
}
