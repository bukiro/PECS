import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class DisplayService {

    public static setPageHeight(): void {
        document.documentElement.style.height = `${ window.innerHeight }px`;
        //document.getElementsByTagName('app-root')[0].setAttribute('style', `height: ${ window.innerHeight }px`);
    }

    public static get isMobile(): boolean {
        return window.innerWidth < 992;
    }

}
