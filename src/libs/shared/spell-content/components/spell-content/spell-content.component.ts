import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Trait } from 'src/app/classes/hints/trait';
import { Spell } from 'src/app/classes/spells/spell';
import { SpellCasting } from 'src/app/classes/spells/spell-casting';
import { SpellTraditions } from 'src/libs/shared/definitions/spell-traditions';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { TraitComponent } from '../../../ui/trait/components/trait/trait.component';
import { ActionIconsComponent } from '../../../ui/action-icons/components/action-icons/action-icons.component';
import { DescriptionComponent } from '../../../ui/description/components/description/description.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-spell-content',
    templateUrl: './spell-content.component.html',
    styleUrls: ['./spell-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        DescriptionComponent,
        ActionIconsComponent,
        TraitComponent,
    ],
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
