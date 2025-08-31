import { Injectable, Signal, signal } from '@angular/core';

const triggerMax = 10;

@Injectable({
    providedIn: 'root',
})
export class SpellSelectionService {

    public readonly closeSpellSelections$$: Signal<number>;

    private readonly _closeSpellSelections$$ = signal<number>(0);

    constructor() {
        this.closeSpellSelections$$ = this._closeSpellSelections$$.asReadonly();
    }

    public closeSpellSelections(): void {
        this._closeSpellSelections$$.update(value => value + 1 % triggerMax);
    }

}
