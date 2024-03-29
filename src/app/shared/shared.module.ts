import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconDefinition } from '@ant-design/icons-angular';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { QuestionCircleOutline } from '@ant-design/icons-angular/icons';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { RoughNotationModule } from 'ng-rough-notation';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NgxVibrationModule } from 'ngx-vibration';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { TimestampToDatePipe } from './pipes/timestamp-to-date.pipe';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { GLOBAL_CONFIG } from '../global-config';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { ShareButtonsModule } from './share-buttons/share-buttons.module';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { CookiesConsentComponent } from './cookies-consent/cookies-consent.component';
import { AnalyticsEventDirective } from '@analytics/analytics-event.directive';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { IfAdminDirective } from './if-admin.directive';
import { TranslocoModule } from '@ngneat/transloco';
import { LanguageSwitcherModule } from '../transloco/language-switcher/language-switcher.module';
import { IfLangDirective } from '../transloco/if-lang.directive';
import { NzImageModule } from 'ng-zorro-antd/image';

// tslint:disable-next-line:readonly-array
const icons: IconDefinition[] = [QuestionCircleOutline];

const components: ReadonlyArray<any> = [
	TimestampToDatePipe,
	CookiesConsentComponent,
	AnalyticsEventDirective,
	IfAdminDirective,
	IfLangDirective,
];

const modules: ReadonlyArray<any> = [
	CommonModule,
	RouterModule,
	FormsModule,
	ReactiveFormsModule,
	FlexLayoutModule,
	NzInputModule,
	NzButtonModule,
	NzFormModule,
	NzCardModule,
	NzToolTipModule,
	NzAlertModule,
	NzMessageModule,
	NzSkeletonModule,
	NzModalModule,
	NzSpinModule,
	NzResultModule,
	NzTypographyModule,
	NzDrawerModule,
	NzAffixModule,
	NzListModule,
	NzMenuModule,
	NzEmptyModule,
	NzBadgeModule,
	NzPopoverModule,
	NzPopconfirmModule,
	NzTagModule,
	NzTabsModule,
	NzRadioModule,
	NzDividerModule,
	NzSwitchModule,
	NzImageModule,
	RoughNotationModule,
	NgxVibrationModule.forRoot({
		defaultPattern: GLOBAL_CONFIG.vibration.default,
	}),
	ShareButtonsModule,
	TranslocoModule,
	LanguageSwitcherModule,
];

@NgModule({
	declarations: [...components],
	imports: [...modules, NzIconModule.forChild(icons)],
	exports: [...components, ...modules],
})
export class SharedModule {}
