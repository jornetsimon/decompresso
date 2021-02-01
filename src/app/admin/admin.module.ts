import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { SharedModule } from '../shared/shared.module';
import { ReportsComponent } from './reports/reports.component';
import { ReportComponent } from './reports/report/report.component';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { StatsComponent } from './stats/stats.component';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { RoomsComponent } from './stats/rooms/rooms.component';

@NgModule({
	declarations: [
		AdminComponent,
		ReportsComponent,
		ReportComponent,
		StatsComponent,
		RoomsComponent,
	],
	imports: [
		CommonModule,
		AdminRoutingModule,
		SharedModule,
		NzSelectModule,
		NzDescriptionsModule,
		NzBreadCrumbModule,
		NzStatisticModule,
	],
})
export class AdminModule {}
