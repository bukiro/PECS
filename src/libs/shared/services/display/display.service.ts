import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, Observable } from 'rxjs';
import { Defaults } from 'src/libs/shared/definitions/defaults';

@Injectable({
    providedIn: 'root',
})
export class DisplayService {

    public static isMobile$: Observable<boolean>;

    private static readonly _isMobile$ = new BehaviorSubject<boolean>(false);

    constructor() {
        DisplayService.isMobile$ = DisplayService._isMobile$.pipe(
            distinctUntilChanged(),
        );
    }

    public static get isMobile(): boolean {
        return DisplayService._isMobile$.value;
    }

    public static setMobile(): void {
        DisplayService._isMobile$.next(window.innerWidth < Defaults.mobileBreakpointPx);
    }

    public static setPageHeight(): void {
        document.documentElement.style.height = `${ window.innerHeight }px`;
    }

}
