import { Directive, EventEmitter, HostBinding, Input, Output } from '@angular/core';

@Directive({})
export class ContentElementComponent {

    @Input()
    public showMinimizeButton = false;

    @Input()
    public showTileModeButton = false;

    @Output()
    public readonly toggleMinimized = new EventEmitter<boolean>();

    @Output()
    public readonly toggleTileMode = new EventEmitter<boolean>();

    @Input()
    @HostBinding('class.minimized')
    public minimized = false;

    @Input()
    @HostBinding('class.tile-mode')
    private _tileMode = false;

    @Input()
    @HostBinding('class.list-mode')
    private _listMode = false;

    public get tileMode(): boolean {
        return this._tileMode;
    }

    @Input()
    public set tileMode(tileMode: boolean) {
        this._tileMode = tileMode;
        this._listMode = !tileMode;
    }

}
