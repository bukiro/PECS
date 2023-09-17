import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Item } from 'src/app/classes/Item';
import { DeepPartial } from '../types/deepPartial';
import { Activity } from 'src/app/classes/Activity';
import { ItemTypes } from '../types/item-types';

export type ItemPrototypeFn = <T extends Item>(obj: DeepPartial<T>, options?: { type?: ItemTypes; prototype?: T }) => T;
export type ActivityLookupFn = (obj: DeepPartial<ActivityGain>) => Activity;

export interface RecastFns {
    getItemPrototype: ItemPrototypeFn;
    getOriginalActivity: ActivityLookupFn;
}
