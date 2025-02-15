import { Injectable } from '@angular/core';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { Item } from 'src/app/classes/items/item';
import { RecastFns, ItemPrototypeFn, ActivityLookupFn } from '../../definitions/interfaces/recast-fns';
import { MaybeSerialized } from '../../definitions/interfaces/serializable';

@Injectable({
    providedIn: 'root',
})
export class RecastService {

    /**
     * A set of functions to restore unsaved content to certain objects after JSON conversion.
     * Use this set in recast functions if the data has been received from the API.
     */
    public static readonly restoreFns: RecastFns = {
        getItemPrototype: <T extends Item>(obj: MaybeSerialized<T>) => {
            throw new Error(`[RecastService] restore functions not ready when casting ${ obj.name }`);
        },
        getOriginalActivity: (obj: MaybeSerialized<ActivityGain>) => {
            throw new Error(`[RecastService] restore functions  not ready when casting ${ obj.name }`);
        },
    };

    /**
     * A set of functions that can be used as restoreFns but don't restore content.
     * Use this set in recast functions if the content is already there and just needs to be recast.
     */
    public static readonly recastFns: RecastFns = {
        getItemPrototype: <T extends Item>(obj: MaybeSerialized<T>) => {
            throw new Error(`[RecastService] recast functions not ready when casting ${ obj.name }`);
        },
        getOriginalActivity: (obj: MaybeSerialized<ActivityGain>) => {
            throw new Error(`[RecastService] recast functions not ready when casting ${ obj.name }`);
        },
    };

    public registerItemRecastFns(restoredPrototypeFn: ItemPrototypeFn, blankPrototypeFn: ItemPrototypeFn): void {
        RecastService.restoreFns.getItemPrototype = restoredPrototypeFn;
        RecastService.recastFns.getItemPrototype = blankPrototypeFn;
    }

    public registerActivityGainRecastFns(activityLookupFn: ActivityLookupFn): void {
        RecastService.restoreFns.getOriginalActivity = activityLookupFn;
        RecastService.recastFns.getOriginalActivity = activityLookupFn;
    }

}
