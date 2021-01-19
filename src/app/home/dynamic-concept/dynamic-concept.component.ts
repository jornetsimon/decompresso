import { Component } from '@angular/core';
import { timer } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
	selector: 'mas-dynamic-concept',
	templateUrl: './dynamic-concept.component.html',
	styleUrls: ['./dynamic-concept.component.scss'],
})
export class DynamicConceptComponent {
	private domainPool: ReadonlyArray<string> = [
		'carrefour.fr',
		'univ-nantes.fr',
		'sncf.com',
		'renault.fr',
		'unicef.fr',
		'apple.com',
		'danone.fr',
		'sanofi.fr',
		'apec.fr',
		'airfrance.fr',
		'loreal.com',
		'decathlon.fr',
		'ac-rennes.fr',
		'ubisoft.com',
		'ratp.fr',
		'total.fr',
	];
	private poolIndex = 0;
	domain$ = timer(0, 7000).pipe(
		map(() => {
			const index = this.poolIndex;
			this.poolIndex = index + 1 < this.domainPool.length ? index + 1 : 0;
			return this.domainPool[index];
		}),
		shareReplay(1)
	);
}
