import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';

@Component({
    selector: 'app-character-sheet-base',
    template: '',
    styleUrls: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export abstract class CharacterSheetBaseComponent extends TrackByMixin(BaseClass) {

    @Input()
    public shownMode = 'All';

    @Input()
    public attacksAndSpellsOrder: Record<string, number> = {};

    @Output()
    public readonly shownModeChanged = new EventEmitter();

    constructor() {
        super();
    }

    public toggleShownMode(type: string): void {
        this.shownMode = this.shownMode === type ? 'All' : type;

        this.shownModeChanged.emit(this.shownMode);
    }

}
