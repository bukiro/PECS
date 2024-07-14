import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Trait } from 'src/app/classes/hints/trait';
import { Spell } from 'src/app/classes/spells/spell';
import { SpellCasting } from 'src/app/classes/spells/spell-casting';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

@Component({
    selector: 'app-spell-content',
    templateUrl: './spell-content.component.html',
    styleUrls: ['./spell-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellContentComponent extends TrackByMixin(BaseClass) {

    @Input()
    public spell!: Spell;
    @Input()
    public spellLevel!: number;
    @Input()
    public casting?: SpellCasting;

    public spellTraditionsEnum = SpellTraditions;

    constructor(
        private readonly _traitsDataService: TraitsDataService,
        private readonly _spellsDataService: SpellsDataService,
    ) {
        super();
    }

    public traitFromName(name: string): Trait {
        return this._traitsDataService.traitFromName(name);
    }

    public heightenedText(text: string): string {
        return this.spell.heightenedText(text, this.spellLevel);
    }

    public spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

}
