import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdminComponent } from './admin.component';
import { ReportsComponent } from './reports/reports.component';
import { ReportComponent } from './reports/report/report.component';
import { StatsComponent } from './stats/stats.component';
import { RoomsComponent } from './stats/rooms/rooms.component';
import { InviteComponent } from './invite/invite.component';

const routes: Routes = [
	{ path: '', component: AdminComponent },
	{
		path: 'reports',
		component: ReportsComponent,
		children: [{ path: ':id', component: ReportComponent }],
	},
	{
		path: 'stats',
		component: StatsComponent,
	},
	{
		path: 'rooms',
		component: RoomsComponent,
	},
	{
		path: 'invite',
		component: InviteComponent,
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class AdminRoutingModule {}
