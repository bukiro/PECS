import { EffectGain } from './EffectGain';
import { Effect } from './Effect';
import { ActivityGain } from './ActivityGain';
import { ItemGain } from './ItemGain';

export interface Item {
    type: string;
    name: string;
    bulk: string;
    equip: boolean;
    invested: boolean;
    gainActivity: string[];
    gainItems: ItemGain[];
    traits: string[];
    effects: EffectGain[];
    specialEffects: EffectGain[];
    showon: string;
    hint: string;
}
