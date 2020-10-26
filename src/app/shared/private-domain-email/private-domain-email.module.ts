import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrivateDomainEmailComponent } from './private-domain-email.component';
import { SharedModule } from '../shared.module';

@NgModule({
	declarations: [PrivateDomainEmailComponent],
	imports: [CommonModule, SharedModule],
	exports: [PrivateDomainEmailComponent],
})
export class PrivateDomainEmailModule {}
