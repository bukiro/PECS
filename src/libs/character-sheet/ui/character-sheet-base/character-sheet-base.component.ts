import { Component, ChangeDetectionStrategy, model } from '@angular/core';

@Component({
    selector: 'app-character-sheet-base',
    template: '',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class CharacterSheetBaseComponent<Modes extends (string | null)> {
    public readonly shownMode$$ = model<Modes | 'All'>('All', { alias: 'shownMode' });

    public toggleShownMode(type: Modes): void {
        this.shownMode$$.update(value => value === type ? 'All' : type);
    }
}
