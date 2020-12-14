import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { SharedModule } from '../shared/shared.module';
import { ReportsComponent } from './reports/reports.component';
import { ReportComponent } from './reports/report/report.component';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';

@NgModule({
	declarations: [AdminComponent, ReportsComponent, ReportComponent],
	imports: [CommonModule, AdminRoutingModule, SharedModule, NzSelectModule, NzDescriptionsModule],
})
export class AdminModule {}
