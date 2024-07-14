import { Activity } from 'src/app/classes/activities/activity';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { Item } from 'src/app/classes/items/item';
import { DeepPartial } from '../types/deepPartial';
import { ItemTypes } from '../types/item-types';

export type ItemPrototypeFn = <T extends Item>(obj: DeepPartial<T>, options?: { type?: ItemTypes; prototype?: T }) => T;
export type ActivityLookupFn = (obj: DeepPartial<ActivityGain>) => Activity;

export interface RecastFns {
    getItemPrototype: ItemPrototypeFn;
    getOriginalActivity: ActivityLookupFn;
}
