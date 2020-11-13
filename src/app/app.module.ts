import { BrowserModule } from '@angular/platform-browser';
import { LOCALE_ID, NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { fr_FR, NZ_I18N } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import fr from '@angular/common/locales/fr';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { LayoutComponent } from './layout/layout.component';
import { SharedModule } from './shared/shared.module';
import { AngularFireModule } from '@angular/fire';
import {
	AngularFirestoreModule,
	USE_EMULATOR as USE_FIRESTORE_EMULATOR,
} from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import {
	AngularFireFunctionsModule,
	USE_EMULATOR as USE_FUNCTIONS_EMULATOR,
} from '@angular/fire/functions';
import { AngularFireAuthModule, USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/auth';
import { WelcomeComponent } from './welcome/welcome.component';
import { CheckCircleFill, CommentOutline } from '@ant-design/icons-angular/icons';
import { ServiceWorkerModule } from '@angular/service-worker';

registerLocaleData(fr);

@NgModule({
	declarations: [AppComponent, LayoutComponent, WelcomeComponent],
	imports: [
		BrowserModule,
		AppRoutingModule,
		FormsModule,
		HttpClientModule,
		BrowserAnimationsModule,
		SharedModule,
		NzIconModule.forRoot([CommentOutline, CheckCircleFill]),
		AngularFireModule.initializeApp(environment.firebase),
		AngularFirestoreModule,
		AngularFireFunctionsModule,
		AngularFireAuthModule,
		ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
	],
	providers: [
		{ provide: NZ_I18N, useValue: fr_FR },
		{ provide: LOCALE_ID, useValue: 'fr' },
		{
			provide: USE_FIRESTORE_EMULATOR,
			useValue: environment.useEmulators ? ['localhost', 8888] : undefined,
		},
		{
			provide: USE_FUNCTIONS_EMULATOR,
			useValue: environment.useEmulators ? ['localhost', 5001] : undefined,
		},
		{
			provide: USE_AUTH_EMULATOR,
			useValue: environment.useEmulators ? ['localhost', 9099] : undefined,
		},
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
