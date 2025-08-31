import { Injectable, Signal, signal } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class PopoversService {

    public readonly closePopovers$$: Signal<boolean>;

    private readonly _closePopovers$$ = signal(false);

    constructor() {
        this.closePopovers$$ = this._closePopovers$$.asReadonly();
    }

    public closePopovers(): void {
        this._closePopovers$$.update(value => !value);
    }

}
