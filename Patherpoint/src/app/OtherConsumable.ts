import { ConditionGain } from './ConditionGain';
import { Consumable } from './Consumable';
import { ActivityGain } from './ActivityGain';

export class OtherConsumable implements Consumable {
    public type: string = "otherconsumables";
    public name: string = "";
    public level: number = 0;
    public bulk: string = "";
    public price: number = 0;
    public amount: number = 1;
    //stack: How many do you buy at once - this is also how many make up one bulk unit
    public stack: number = 1;
    public actions: string = "1";
    public activationType: string = "";
    public desc: string = "";
    public subType: string = "";
    public subTypeDesc: string = "";
    public gainActivity: ActivityGain[] = [];
    public gainCondition: ConditionGain[];
    public traits: string[] = [];
}