import { Injectable } from '@angular/core';
import {
	ActivatedRouteSnapshot,
	CanActivateChild,
	Router,
	RouterStateSnapshot,
	UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class LanguageGuard implements CanActivateChild {
	private allowedLanguageTags: ReadonlyArray<string> = [
		'fr',
		'fr-FR',
		'fr-BE',
		'fr-CH',
		'fr-LU',
		'en',
		'en-US',
		'en-GB',
	].map((x) => x.toLowerCase());
	constructor(private router: Router) {}
	canActivateChild(
		childRoute: ActivatedRouteSnapshot,
		state: RouterStateSnapshot
	): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
		if (
			!navigator.languages.some((tag) => this.allowedLanguageTags.includes(tag.toLowerCase()))
		) {
			return this.router.parseUrl('/sorry');
		}
		return true;
	}
}
