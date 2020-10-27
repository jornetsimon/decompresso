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
import { AngularFirestoreModule, SETTINGS as FIRESTORE_SETTINGS } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

registerLocaleData(fr);

@NgModule({
	declarations: [AppComponent, LayoutComponent],
	imports: [
		BrowserModule,
		AppRoutingModule,
		FormsModule,
		HttpClientModule,
		BrowserAnimationsModule,
		SharedModule,
		NzIconModule.forRoot([]),
		AngularFireModule.initializeApp(environment.firebase),
		AngularFirestoreModule,
	],
	providers: [
		{ provide: NZ_I18N, useValue: fr_FR },
		{ provide: LOCALE_ID, useValue: 'fr' },
		{
			provide: FIRESTORE_SETTINGS,
			useFactory: () =>
				environment.production ||
				environment.staging ||
				window.location.hostname !== 'localhost'
					? {}
					: { host: 'localhost:8888', ssl: false },
		},
	],
	bootstrap: [AppComponent],
})
export class AppModule {}
