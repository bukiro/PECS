import { computed } from '@angular/core';
import { CreatureMagicAdapter } from './creature-magic-adapter';
import { Character } from 'src/libs/shared/character/util/models/character';
import { spellLevelFromCharLevel } from '../../models/spell-utils';
import { CreatureSpellCollectionAdapter } from '../creature-spell-collection-adapter/creature-spell-collection-adapter';
import { CharacterSpellCollectionAdapter } from '../creature-spell-collection-adapter/character-spell-collection-adapter';
import { CreatureSpellLevelAdapter } from '../creature-spell-level-adapter/creature-spell-level-adapter';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { CreatureSpellChoicePropertiesAdapter } from '../creature-spell-choice-properties-adapter/creature-spell-choice-properties-adapter';
import { CreatureSpellGainPropertiesAdapter } from '../creature-spell-gain-properties-adapter/creature-spell-gain-properties-adapter';

export class CharacterMagicAdapter implements CreatureMagicAdapter {

    public readonly spellCollectionAdapter: CreatureSpellCollectionAdapter;
    public readonly spellLevelAdapter: CreatureSpellLevelAdapter;
    public readonly spellGainPropertiesAdapter: CreatureSpellGainPropertiesAdapter;
    public readonly spellChoicePropertiesAdapter: CreatureSpellChoicePropertiesAdapter;

    public readonly maxPersonalSpellLevel$$ = computed(() =>
        spellLevelFromCharLevel(this._character.level()),
    );

    constructor(
        private readonly _character: Character,
        recastFns: RecastFns,
    ) {
        this.spellCollectionAdapter = new CharacterSpellCollectionAdapter(_character);
        this.spellLevelAdapter = new CreatureSpellLevelAdapter(_character);
        this.spellGainPropertiesAdapter = new CreatureSpellGainPropertiesAdapter(_character, _character, recastFns);
        this.spellChoicePropertiesAdapter = new CreatureSpellChoicePropertiesAdapter(_character, _character, recastFns);
    }

}
