import { Activity } from './Activity';

//ItemActivity combines Activity and ActivityGain, so that an item can have its own contained activity.
export class ItemActivity extends Activity {
    public readonly _className: string = this.constructor.name;
    public active: boolean = false;
    public activeCooldown: number = 0;
    public level: number = 0;
    public source: string = "";
    //Resonant item activities are only available when the item is slotted into a wayfinder.
    public resonant: boolean = false;
}