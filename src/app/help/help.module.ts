import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpComponent } from './help.component';
import { SharedModule } from '../shared/shared.module';
import { RouterModule, Routes } from '@angular/router';

const helpRoutes: Routes = [
	{
		path: '',
		component: HelpComponent,
	},
];

@NgModule({
	declarations: [HelpComponent],
	imports: [CommonModule, SharedModule, RouterModule.forChild(helpRoutes)],
})
export class HelpModule {}
