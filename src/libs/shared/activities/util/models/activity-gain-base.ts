import { ItemGain } from 'src/libs/shared/items/util/models/item-gain';
import { SpellCast } from 'src/libs/shared/spells/util/models/spell-cast';
import { SpellTarget } from 'src/libs/shared/spells/util/models/spell-target';
import { Activity } from './activity';
import { Signal, WritableSignal } from '@angular/core';
import { CreatureTypes } from 'src/libs/shared/creatures/util/models/creature-types';

export interface ActivityGainBase {
    sharedChargesID: number;
    exclusiveActivityID: number;
    level: number;
    heightened: number;
    source: string;
    selectedTarget: '' | 'self' | 'Selected' | CreatureTypes;
    id: string;
    name: string;
    active: WritableSignal<boolean>;
    activeCooldown: WritableSignal<number>;
    chargesUsed: WritableSignal<number>;
    duration: WritableSignal<number>;

    originalActivity$$: Signal<Activity>;

    gainItems: Array<ItemGain>;
    castSpells: Array<SpellCast>;
    effectChoices: WritableSignal<Array<{ condition: string; choice: string }>>;
    data: Array<{ name: string; value: string }>;
    spellEffectChoices: WritableSignal<Array<Array<{ condition: string; choice: string }>>>;
    targets: Array<SpellTarget>;

    activeCooldownByCreature$$: Map<string, Signal<number>>;
}
