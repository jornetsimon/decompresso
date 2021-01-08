import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import {
	ShareButtonsConfig as NgxShareButtonsConfig,
	ShareModule as NgxShareModule,
} from 'ngx-sharebuttons';
import { ShareButtonComponent } from './share-button/share-button.component';
import { FacebookButtonComponent } from './facebook-button.component';
import { TwitterButtonComponent } from './twitter-button.component';
import { LinkedinButtonComponent } from './linkedin-button.component';
import { EmailButtonComponent } from './email-button.component';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { WhatsappButtonComponent } from './whatsapp-button.component';

const customConfig: NgxShareButtonsConfig = {
	gaTracking: true,
	title: 'Décompresso - Le chat anonyme au bureau',
	description: 'Rejoins-moi pour chatter anonymement avec les collègues !',
	url: 'https://decompresso-fr.web.app',
	autoSetMeta: false,
};

const components: ReadonlyArray<any> = [
	ShareButtonComponent,
	FacebookButtonComponent,
	TwitterButtonComponent,
	LinkedinButtonComponent,
	EmailButtonComponent,
	WhatsappButtonComponent,
];
@NgModule({
	declarations: [...components],
	imports: [
		CommonModule,
		NzButtonModule,
		NzIconModule.forChild([]),
		NzToolTipModule,
		NgxShareModule.withConfig(customConfig),
	],
	exports: [...components],
})
export class ShareButtonsModule {}
