import { Injectable } from '@angular/core';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Item } from 'src/app/classes/Item';
import { ActivityGainRecastFn, ItemRecastFn, RecastFns } from '../../definitions/interfaces/recastFns';

@Injectable({
    providedIn: 'root',
})
export class RecastService {

    /**
     * A set of functions to restore unsaved content to certain objects after JSON conversion.
     * Use this set in recast functions if the data has been received from the API.
     */
    public readonly restoreFns: RecastFns = {
        item: <T extends Item>(obj: T) => obj,
        activityGain: (obj: ActivityGain) => obj,
    };

    /**
     * A set of functions that can be used as restoreFns but don't restore content.
     * Use this set in recast functions if the content is already there and just needs to be recast.
     */
    public readonly recastOnlyFns: RecastFns = {
        item: <T extends Item>(obj: T) => obj,
        activityGain: (obj: ActivityGain) => obj,
    };

    /* eslint-disable @typescript-eslint/no-dynamic-delete */
    /**
     * A set of function that removes content that should not be saved.
     * Use this set in recast functions if the content is about to be sent to the API.
     */
    public readonly cleanForSaveFns: RecastFns = {
        item: <T extends Item>(obj: T, options: { type?: string } = {}) => {
            (Object.keys(obj) as Array<keyof T & string>).forEach(key => {
                if (obj.neversave.includes(key) || key.charAt(0) === '$') {
                    delete obj[key];
                }
            });

            return this.recastOnlyFns.item(obj, options);
        },
        activityGain: (obj: ActivityGain) => {
            (Object.keys(obj) as Array<keyof ActivityGain & string>).forEach(key => {
                if (key.charAt(0) === '$') {
                    delete obj[key];
                }
            });

            return this.recastOnlyFns.activityGain(obj);
        },
    };
    /* eslint-enable @typescript-eslint/no-dynamic-delete */

    public registerItemRecastFns(itemRestoreFn: ItemRecastFn, itemRecastFn: ItemRecastFn): void {
        this.restoreFns.item = itemRestoreFn;
        this.recastOnlyFns.item = itemRecastFn;
    }

    public registerActivityGainRecastFns(activityGainRestoreFn: ActivityGainRecastFn, activityGainRecastFn: ActivityGainRecastFn): void {
        this.restoreFns.activityGain = activityGainRestoreFn;
        this.recastOnlyFns.activityGain = activityGainRecastFn;
    }

}
