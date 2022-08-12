import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Spell } from 'src/app/classes/Spell';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { TraitsService } from 'src/app/services/traits.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Trait } from 'src/app/classes/Trait';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { SpellsDataService } from 'src/app/core/services/data/spells-data.service';

@Component({
    selector: 'app-spellContent',
    templateUrl: './spellContent.component.html',
    styleUrls: ['./spellContent.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellContentComponent {

    @Input()
    public spell: Spell;
    @Input()
    public spellLevel: number;
    @Input()
    public casting: SpellCasting = null;

    public spellTraditionsEnum = SpellTraditions;

    constructor(
        private readonly _traitsService: TraitsService,
        private readonly _spellsDataService: SpellsDataService,
        public trackers: Trackers,
    ) { }

    public traitFromName(name: string): Trait {
        return this._traitsService.traitFromName(name);
    }

    public heightenedText(text: string): string {
        return this.spell.heightenedText(text, this.spellLevel);
    }

    public spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

}
