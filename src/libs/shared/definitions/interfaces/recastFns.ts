import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Item } from 'src/app/classes/Item';

export type ItemRecastFn = <T extends Item>(obj: T, options?: { type?: string }) => T;
export type ActivityGainRecastFn = (obj: ActivityGain) => ActivityGain;

export interface RecastFns {
    item: ItemRecastFn;
    activityGain: ActivityGainRecastFn;
}

export const recastFnsforTesting = {
    item: <T extends Item>(obj: T, options?: { type?: string }) =>
        Object.assign(obj, { type: options?.type ?? obj.type }),
    activityGain: (obj: ActivityGain) => obj,
};
