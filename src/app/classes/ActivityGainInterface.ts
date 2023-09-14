import { ItemGain } from 'src/app/classes/ItemGain';
import { SpellCast } from 'src/app/classes/SpellCast';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { Activity } from './Activity';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ActivityGainInterface {
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
