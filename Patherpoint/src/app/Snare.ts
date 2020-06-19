import { Consumable } from './Consumable';

export class Snare extends Consumable {
    public readonly _className: string = this.constructor.name;
    //Snares should be type "snares" to be found in the database
    readonly type = "snares";
    public critfailure: string = "";
    public critsuccess: string = "";
    public failure: string = "";
    public success: string = "";
    public tradeable: boolean = false;
    public actions = "1 minute";
}