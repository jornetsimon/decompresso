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
import {
	AngularFireDatabaseModule,
	USE_EMULATOR as USE_DATABASE_EMULATOR,
} from '@angular/fire/database';
import { AngularFireAuthModule, USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/auth';
import { WelcomeComponent } from './welcome/welcome.component';
import {
	CheckCircleFill,
	CheckCircleTwoTone,
	CommentOutline,
	FacebookFill,
	HomeOutline,
	IdcardFill,
	LinkedinOutline,
	MailFill,
	MailOutline,
	MessageOutline,
	ReadOutline,
	SafetyCertificateFill,
	TwitterOutline,
	UserOutline,
	WhatsAppOutline,
} from '@ant-design/icons-angular/icons';
import { ServiceWorkerModule } from '@angular/service-worker';
import { LayoutModule } from './layout/layout.module';
import {
	AngularFireAnalyticsModule,
	COLLECTION_ENABLED,
	CONFIG as AnalyticsConfig,
	DEBUG_MODE as ANALYTICS_DEBUG_MODE,
	ScreenTrackingService,
} from '@angular/fire/analytics';

registerLocaleData(fr);

@NgModule({
	declarations: [AppComponent, WelcomeComponent],
	imports: [
		BrowserModule,
		AppRoutingModule,
		FormsModule,
		HttpClientModule,
		BrowserAnimationsModule,
		SharedModule,
		NzIconModule.forRoot([
			CommentOutline,
			CheckCircleFill,
			MailOutline,
			MailFill,
			SafetyCertificateFill,
			IdcardFill,
			CheckCircleTwoTone,
			FacebookFill,
			TwitterOutline,
			LinkedinOutline,
			MessageOutline,
			WhatsAppOutline,
			UserOutline,
			ReadOutline,
			HomeOutline,
		]),
		AngularFireModule.initializeApp(environment.firebase),
		AngularFirestoreModule.enablePersistence(),
		AngularFireDatabaseModule,
		AngularFireFunctionsModule,
		AngularFireAuthModule,
		ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
		LayoutModule,
		AngularFireAnalyticsModule,
	],
	providers: [
		{ provide: NZ_I18N, useValue: fr_FR },
		{ provide: LOCALE_ID, useValue: 'fr' },
		{
			provide: USE_FIRESTORE_EMULATOR,
			useValue: environment.useEmulators ? ['localhost', 8888] : undefined,
		},
		{
			provide: USE_DATABASE_EMULATOR,
			useValue: environment.useEmulators ? ['localhost', 9000] : undefined,
		},
		{
			provide: USE_FUNCTIONS_EMULATOR,
			useValue: environment.useEmulators ? ['localhost', 5001] : undefined,
		},
		{
			provide: USE_AUTH_EMULATOR,
			useValue: environment.useEmulators ? ['localhost', 9099] : undefined,
		},
		{
			provide: AnalyticsConfig,
			useValue: {
				anonymize_ip: true,
			},
		},
		{ provide: ANALYTICS_DEBUG_MODE, useValue: !environment.production },
		{
			provide: COLLECTION_ENABLED,
			useValue: localStorage.getItem('cookies-consent') === 'true' && environment.production,
		},
		ScreenTrackingService,
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
