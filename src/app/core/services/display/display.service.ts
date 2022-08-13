import { Injectable } from '@angular/core';
import { Defaults } from 'src/libs/shared/definitions/defaults';

@Injectable({
    providedIn: 'root',
})
export class DisplayService {

    public static get isMobile(): boolean {
        return window.innerWidth < Defaults.mobileBreakpointPx;
    }

    public static setPageHeight(): void {
        document.documentElement.style.height = `${ window.innerHeight }px`;
        //document.getElementsByTagName('app-root')[0].setAttribute('style', `height: ${ window.innerHeight }px`);
    }

}
