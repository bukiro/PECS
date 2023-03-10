import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, Observable } from 'rxjs';
import { Defaults } from 'src/libs/shared/definitions/defaults';

@Injectable({
    providedIn: 'root',
})
export class DisplayService {

    private static _isMobileDistinct$?: Observable<boolean>;

    private static readonly _isMobile$ = new BehaviorSubject<boolean>(false);

    public static get isMobile(): boolean {
        return DisplayService._isMobile$.value;
    }

    public static get isMobile$(): Observable<boolean> {
        if (!DisplayService._isMobileDistinct$) {
            DisplayService._isMobileDistinct$ =
                DisplayService._isMobile$
                    .pipe(
                        distinctUntilChanged(),
                    );
        }

        return DisplayService._isMobileDistinct$;
    }


    public static setMobile(): void {
        DisplayService._isMobile$.next(window.innerWidth <= Defaults.mobileBreakpointPx);
    }

    public static setPageHeight(): void {
        document.documentElement.style.height = `${ window.innerHeight }px`;
    }

}
