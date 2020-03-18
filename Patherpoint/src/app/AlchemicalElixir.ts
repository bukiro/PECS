import { ConditionGain } from './ConditionGain';
import { Consumable } from './Consumable';

export class AlchemicalElixir implements Consumable {
    public type: string = "consumable";
    public bulk: string = "-";
    public amount: number = 1;
    //stack: How many do you buy at once - this is also how many make up one bulk unit
    public stack: number = 1;
    public actions: string = "1";
    public activationType: string = "";
    public name: string = "";
    public desc: string = "";
    public benefit: string = "";
    public drawback: string = "";
    public gainActivity: string[] = [];
    public gainCondition: ConditionGain[];
    public traits: string[] = [];
}