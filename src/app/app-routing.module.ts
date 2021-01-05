import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AngularFireAuthGuard, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import { WelcomeComponent } from './welcome/welcome.component';
import { HomeGuard } from './home/home.guard';
import { AdminGuard } from './admin/admin.guard';
import { LanguageGuard } from './shared/language.guard';

const routes: Routes = [
	{
		path: '',
		component: LayoutComponent,
		canActivateChild: [LanguageGuard],
		children: [
			{
				path: '',
				loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
				canActivate: [HomeGuard],
			},
			{
				path: 'welcome',
				component: WelcomeComponent,
			},
			{
				path: 'room',
				loadChildren: () => import('./room/room.module').then((m) => m.RoomModule),
				canActivate: [AngularFireAuthGuard],
				data: { authGuardPipe: () => redirectUnauthorizedTo(['/']) },
			},
			{
				path: 'help',
				loadChildren: () => import('./help/help.module').then((m) => m.HelpModule),
			},
			{
				path: 'admin',
				loadChildren: () => import('./admin/admin.module').then((m) => m.AdminModule),
				canLoad: [AdminGuard],
			},
		],
	},
	{
		path: 'sorry',
		loadChildren: () =>
			import('./unsupported-language/unsupported-language.module').then(
				(m) => m.UnsupportedLanguageModule
			),
	},
	{ path: '**', redirectTo: '/' },
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {}
