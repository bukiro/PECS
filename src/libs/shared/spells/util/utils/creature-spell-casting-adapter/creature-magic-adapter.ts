import { Signal } from '@angular/core';
import { CreatureSpellLevelAdapter } from '../creature-spell-level-adapter/creature-spell-level-adapter';
import { CreatureSpellCollectionAdapter } from '../creature-spell-collection-adapter/creature-spell-collection-adapter';
import { CreatureSpellChoicePropertiesAdapter } from '../creature-spell-choice-properties-adapter/creature-spell-choice-properties-adapter';
import { CreatureSpellGainPropertiesAdapter } from '../creature-spell-gain-properties-adapter/creature-spell-gain-properties-adapter';

export abstract class CreatureMagicAdapter {

    public abstract readonly spellLevelAdapter: CreatureSpellLevelAdapter;
    public abstract readonly spellCollectionAdapter: CreatureSpellCollectionAdapter;
    public abstract readonly spellGainPropertiesAdapter: CreatureSpellGainPropertiesAdapter;
    public abstract readonly spellChoicePropertiesAdapter: CreatureSpellChoicePropertiesAdapter;

    public abstract readonly maxPersonalSpellLevel$$: Signal<number>;

}
