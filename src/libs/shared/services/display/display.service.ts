import { Injectable, signal, Signal } from '@angular/core';
import { Defaults } from 'src/libs/shared/definitions/defaults';

@Injectable({
    providedIn: 'root',
})
export class DisplayService {
    public static isMobile$$: Signal<boolean>;

    private static readonly _isMobile$$ = signal(false);

    constructor() {
        DisplayService.isMobile$$ = DisplayService._isMobile$$.asReadonly();
    }

    public static get isMobile(): boolean {
        return DisplayService._isMobile$$();
    }

    public static get isDarkMode(): boolean {
        return !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    }

    public static setMobile(): void {
        DisplayService._isMobile$$.set(window.innerWidth <= Defaults.mobileBreakpointPx);
    }

    public static setPageHeight(): void {
        document.documentElement.style.height = `${ window.innerHeight }px`;
    }

}
