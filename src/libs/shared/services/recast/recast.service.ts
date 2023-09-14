import { Injectable } from '@angular/core';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Item } from 'src/app/classes/Item';
import { ActivityLookupFn, ItemPrototypeFn, RecastFns } from '../../definitions/interfaces/recastFns';
import { DeepPartial } from '../../definitions/types/deepPartial';

//TO-DO: Make static
@Injectable({
    providedIn: 'root',
})
export class RecastService {

    /**
     * A set of functions to restore unsaved content to certain objects after JSON conversion.
     * Use this set in recast functions if the data has been received from the API.
     */
    public readonly restoreFns: RecastFns = {
        getItemPrototype: <T extends Item>(obj: DeepPartial<T>) => {
            throw new Error(`[RecastService] restore functions not ready when casting ${ obj.name }`);
        },
        getOriginalActivity: (obj: DeepPartial<ActivityGain>) => {
            throw new Error(`[RecastService] restore functions  not ready when casting ${ obj.name }`);
        },
    };

    /**
     * A set of functions that can be used as restoreFns but don't restore content.
     * Use this set in recast functions if the content is already there and just needs to be recast.
     */
    public readonly recastFns: RecastFns = {
        getItemPrototype: <T extends Item>(obj: DeepPartial<T>) => {
            throw new Error(`[RecastService] recast functions not ready when casting ${ obj.name }`);
        },
        getOriginalActivity: (obj: DeepPartial<ActivityGain>) => {
            throw new Error(`[RecastService] recast functions not ready when casting ${ obj.name }`);
        },
    };

    public registerItemRecastFns(restoredPrototypeFn: ItemPrototypeFn, blankPrototypeFn: ItemPrototypeFn): void {
        this.restoreFns.getItemPrototype = restoredPrototypeFn;
        this.recastFns.getItemPrototype = blankPrototypeFn;
    }

    public registerActivityGainRecastFns(activityLookupFn: ActivityLookupFn): void {
        this.restoreFns.getOriginalActivity = activityLookupFn;
        this.recastFns.getOriginalActivity = activityLookupFn;
    }

}
