import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { HomeComponent } from './home.component';
import { RouterModule, Routes } from '@angular/router';
import { PrivateDomainEmailModule } from '../shared/private-domain-email/private-domain-email.module';
import { SigninComponent } from './signin/signin.component';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import { QuestionCircleOutline } from '@ant-design/icons-angular/icons';

// tslint:disable-next-line:readonly-array
const icons: IconDefinition[] = [QuestionCircleOutline];

const homeRoutes: Routes = [
	{
		path: '',
		component: HomeComponent,
	},
];

@NgModule({
	declarations: [HomeComponent, SigninComponent],
	imports: [
		SharedModule,
		RouterModule.forChild(homeRoutes),
		PrivateDomainEmailModule,
		NzIconModule.forChild(icons),
	],
})
export class HomeModule {}
