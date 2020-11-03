import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AngularFireAuthGuard, redirectLoggedInTo } from '@angular/fire/auth-guard';
import { WelcomeComponent } from './welcome/welcome.component';

const routes: Routes = [
	{
		path: '',
		component: LayoutComponent,
		children: [
			{
				path: '',
				loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
				canActivate: [AngularFireAuthGuard],
				data: { authGuardPipe: () => redirectLoggedInTo(['welcome']) },
			},
			{
				path: 'welcome',
				component: WelcomeComponent,
			},
		],
	},
	{ path: '**', redirectTo: '/' },
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {}
