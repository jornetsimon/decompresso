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

// tslint:disable-next-line:readonly-array
const icons: IconDefinition[] = [QuestionCircleOutline];

const components: ReadonlyArray<any> = [];

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
	RoughNotationModule,
	NgxVibrationModule.forRoot({
		defaultPattern: [25]
	})
];

@NgModule({
	declarations: [...components],
	imports: [...modules, NzIconModule.forChild(icons)],
	exports: [...components, ...modules],
})
export class SharedModule {}
