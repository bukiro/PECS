import { Activity } from 'src/app/classes/activities/activity';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { Item } from 'src/app/classes/items/item';
import { DeepPartial } from '../types/deep-partial';
import { ItemTypes } from '../types/item-types';

export type ItemPrototypeFn = <T extends Item>(obj: DeepPartial<T>, options?: { type?: ItemTypes; prototype?: T }) => T;
export type ActivityLookupFn = (obj: DeepPartial<ActivityGain>) => Activity;

export interface RecastFns {
    getItemPrototype: ItemPrototypeFn;
    getOriginalActivity: ActivityLookupFn;
}

export const mockRecastFns = ({ item, activity }: { item?: Item; activity?: Activity } = {}): RecastFns => ({
    getItemPrototype: <T extends Item>(obj: DeepPartial<T>) => (obj ?? item) as T,
    getOriginalActivity: () => activity ?? new Activity(),
});
