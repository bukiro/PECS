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

export const recastFnsforTesting: RecastFns = {
    getItemPrototype: <T extends Item>(obj: DeepPartial<T>, options?: { type?: string }) =>
        Object.assign(obj, { type: options?.type ?? obj.type }) as T,
    getOriginalActivity: (_obj: DeepPartial<ActivityGain>) => new Activity(),
};
