import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

// TODO: These two outputs have nothing to do with each other and should to into different services.
@Injectable({
    providedIn: 'root',
})
export class RefreshService {
    public closePopovers$: Observable<void>;
    public closeSpellSelections$: Observable<void>;

    private readonly _closePopovers$ = new Subject<void>();
    private readonly _closeSpellSelections$ = new Subject<void>();

    constructor() {
        this.closePopovers$ = this._closePopovers$.asObservable();
        this.closeSpellSelections$ = this._closeSpellSelections$.asObservable();
    }

    public closePopovers(): void {
        this._closePopovers$.next();
    }

    public closeSpellSelections(): void {
        this._closeSpellSelections$.next();
    }

}
