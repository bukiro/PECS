import { ItemGain } from './ItemGain';

export class ActivityGain {
    public readonly _className: string = this.constructor.name;
    public active: boolean = false;
    public activeCooldown: number = 0;
    public chargesUsed: number = 0;
    //If you use a charge of an activity on an item, and it has a sharedChargesID, all activities on the same item with the same sharedChargesID will also use a charge.
    public sharedChargesID: number = 0;
    //If you activate an activity, and it has an exclusiveActivityID, all activities on the same item with the same sharedChargesID are automatically deactivated.
    public exclusiveActivityID: number = 0;
    public duration: number = 0;
    //The character level where this activity becomes available
    public level: number = 0;
    public name: string = "";
    public source: string = "";
    public data: {name:string, value:any}[] = [];
    //We copy the activities ItemGains here whenever we activate it, so we can store the item ID.
    public gainItems: ItemGain[] = [];
}