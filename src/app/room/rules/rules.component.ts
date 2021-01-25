import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AnalyticsService } from '@analytics/analytics.service';

@Component({
	selector: 'mas-rules',
	templateUrl: './rules.component.html',
	styleUrls: ['./rules.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulesComponent implements OnInit {
	constructor(private analyticsService: AnalyticsService) {}
	ngOnInit(): void {
		this.analyticsService.logEvent('content_view', undefined, `Règles du salon`);
	}
}
