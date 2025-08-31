import { computed } from '@angular/core';
import { CreatureSpellLevelAdapter } from '../creature-spell-level-adapter/creature-spell-level-adapter';
import { CreatureSpellCollectionAdapter } from '../creature-spell-collection-adapter/creature-spell-collection-adapter';
import { CreatureMagicAdapter } from './creature-magic-adapter';
import { NullSpellCollectionAdapter } from '../creature-spell-collection-adapter/null-spell-collection-adapter';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { spellLevelFromCharLevel } from '../../models/spell-utils';
import { Character } from 'src/libs/shared/character/util/models/character';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { CreatureSpellChoicePropertiesAdapter } from '../creature-spell-choice-properties-adapter/creature-spell-choice-properties-adapter';
import { CreatureSpellGainPropertiesAdapter } from '../creature-spell-gain-properties-adapter/creature-spell-gain-properties-adapter';

export class DefaultCreatureMagicAdapter implements CreatureMagicAdapter {

    public readonly spellLevelAdapter: CreatureSpellLevelAdapter;
    public readonly spellCollectionAdapter: CreatureSpellCollectionAdapter;
    public readonly spellGainPropertiesAdapter: CreatureSpellGainPropertiesAdapter;
    public readonly spellChoicePropertiesAdapter: CreatureSpellChoicePropertiesAdapter;

    public readonly maxPersonalSpellLevel$$ = computed(() =>
        spellLevelFromCharLevel(this._character.level()),
    );

    constructor(
        _creature: Creature,
        private readonly _character: Character,
        recastFns: RecastFns,
    ) {
        this.spellCollectionAdapter = new NullSpellCollectionAdapter();
        this.spellLevelAdapter = new CreatureSpellLevelAdapter(_creature);
        this.spellChoicePropertiesAdapter = new CreatureSpellChoicePropertiesAdapter(_creature, _character, recastFns);
        this.spellGainPropertiesAdapter = new CreatureSpellGainPropertiesAdapter(_creature, _character, recastFns);
    }

}
