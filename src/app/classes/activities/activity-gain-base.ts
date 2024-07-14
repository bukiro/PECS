import { BehaviorSubject, Observable } from 'rxjs';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { ItemGain } from '../items/item-gain';
import { SpellCast } from '../spells/spell-cast';
import { SpellTarget } from '../spells/spell-target';
import { Activity } from './activity';

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
    active: boolean;
    activeCooldown: number;
    chargesUsed: number;

    originalActivity: Activity;

    gainItems: Array<ItemGain>;
    castSpells: Array<SpellCast>;
    effectChoices: Array<{ condition: string; choice: string }>;
    data: Array<{ name: string; value: string }>;
    spellEffectChoices: Array<Array<{ condition: string; choice: string }>>;
    targets: Array<SpellTarget>;

    active$: BehaviorSubject<boolean>;
    chargesUsed$: BehaviorSubject<number>;
    activeCooldown$: BehaviorSubject<number>;
    activeCooldownByCreature$: Map<string, Observable<number>>;
}
