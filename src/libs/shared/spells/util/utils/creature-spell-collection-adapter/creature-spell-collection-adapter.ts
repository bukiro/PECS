import { Signal } from '@angular/core';
import { SpellCasting } from '../../models/spell-casting';
import { SpellCastingFilter } from '../../models/spell-casting-filter';
import { SpellChoiceFilter } from '../../models/spell-choice-filter';
import { SpellGainAggregate } from '../../models/spell-gain-aggregate';
import { SpellGainFilter } from '../../models/spell-gain-filter';

export abstract class CreatureSpellCollectionAdapter {

    public abstract takenSpells$$(
        {
            minLevelNumber,
            maxLevelNumber,
        }: {
            minLevelNumber: number;
            maxLevelNumber: number;
        },
        filter: SpellCastingFilter & SpellChoiceFilter & SpellGainFilter,
    ): Signal<Array<SpellGainAggregate>>;

    public abstract takenSpellsOfSpellCasting$$(
        casting: SpellCasting,
        {
            minLevelNumber,
            maxLevelNumber,
        }: {
            minLevelNumber: number;
            maxLevelNumber: number;
        },
        filter: SpellChoiceFilter & SpellGainFilter,
    ): Signal<Array<SpellGainAggregate>>;

}
