import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { ItemGain } from '../items/item-gain';
import { SpellCast } from '../spells/spell-cast';
import { SpellTarget } from '../spells/spell-target';
import { Activity } from './activity';
import { Signal, WritableSignal } from '@angular/core';

export interface ActivityGainBase {
    sharedChargesID: number;
    exclusiveActivityID: number;
    duration: number;
    level: number;
    heightened: number;
    name: string;
    source: string;
    selectedTarget: '' | 'self' | 'Selected' | CreatureTypes;
    id: string;
    active: WritableSignal<boolean>;
    activeCooldown: WritableSignal<number>;
    chargesUsed: WritableSignal<number>;

    originalActivity: Activity;

    gainItems: Array<ItemGain>;
    castSpells: Array<SpellCast>;
    effectChoices: Array<{ condition: string; choice: string }>;
    data: Array<{ name: string; value: string }>;
    spellEffectChoices: Array<Array<{ condition: string; choice: string }>>;
    targets: Array<SpellTarget>;

    activeCooldownByCreature$$: Map<string, Signal<number>>;
}
