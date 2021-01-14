import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { HomeComponent } from './home.component';
import { RouterModule, Routes } from '@angular/router';
import { PrivateDomainEmailModule } from '../shared/private-domain-email/private-domain-email.module';
import { SigninComponent } from './signin/signin.component';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IconDefinition } from '@ant-design/icons-angular';
import {
	CommentOutline,
	LoginOutline,
	MailOutline,
	QuestionCircleOutline,
} from '@ant-design/icons-angular/icons';
import { LayoutModule } from '../layout/layout.module';
import { DynamicConceptComponent } from './dynamic-concept/dynamic-concept.component';

// tslint:disable-next-line:readonly-array
const icons: IconDefinition[] = [QuestionCircleOutline, MailOutline, CommentOutline, LoginOutline];

const homeRoutes: Routes = [
	{
		path: '',
		component: HomeComponent,
	},
];

@NgModule({
	declarations: [HomeComponent, SigninComponent, DynamicConceptComponent],
	imports: [
		SharedModule,
		RouterModule.forChild(homeRoutes),
		PrivateDomainEmailModule,
		NzIconModule.forChild(icons),
		LayoutModule,
	],
})
export class HomeModule {}
