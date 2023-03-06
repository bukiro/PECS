import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { DisplayService } from 'src/libs/shared/services/display/display.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {

    public title = 'P.E.C.S.';

    constructor() {
        this._setMobile();
    }

    @HostListener('window:resize', ['$event'])
    public onResize(): void {
        this._setMobile();
        DisplayService.setPageHeight();
    }

    @HostListener('window:orientationchange', ['$event'])
    public onRotate(): void {
        this._setMobile();
        DisplayService.setPageHeight();
    }

    private _setMobile(): void {
        DisplayService.setMobile();
    }
}
