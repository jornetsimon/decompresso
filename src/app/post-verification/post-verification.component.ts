import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AuthService } from '@services/auth.service';
import { switchMap, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
	selector: 'mas-post-verification',
	templateUrl: './post-verification.component.html',
	styleUrls: ['./post-verification.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostVerificationComponent implements OnInit {
	constructor(
		private authService: AuthService,
		private router: Router,
		private message: NzMessageService
	) {}

	ngOnInit(): void {
		this.authService.waitForAuthChecked$
			.pipe(
				switchMap(() => this.authService.authCredential$),
				take(1),
				untilDestroyed(this)
			)
			.subscribe((user) => {
				if (user) {
					this.router.navigateByUrl('/welcome');
				} else {
					// If no auth user if found,
					// this means the user opened the verification link in a different browser/session
					// They have to authenticate one more time
					window.localStorage.setItem('is-known', 'true');
					this.message.success(
						'Votre adresse est maintenant vérifiée. Vous pouvez vous connecter.',
						{
							nzDuration: 8000,
						}
					);
					this.router.navigateByUrl('/');
				}
			});
	}
}
