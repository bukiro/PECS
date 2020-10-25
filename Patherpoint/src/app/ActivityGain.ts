import { ItemGain } from './ItemGain';

export class ActivityGain {
    public readonly _className: string = this.constructor.name;
    public active: boolean = false;
    public activeCooldown: number = 0;
    public chargesUsed: number = 0;
    public duration: number = 0;
    //The character level where this activity becomes available
    public level: number = 0;
    public name: string = "";
    public source: string = "";
    public data: {name:string, value:any}[] = [];
    //We copy the activities ItemGains here whenever we activate it, so we can store the item ID.
    public gainItems: ItemGain[] = [];
}