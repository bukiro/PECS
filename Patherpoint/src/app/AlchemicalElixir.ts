import { ConditionGain } from './ConditionGain';
import { Consumable } from './Consumable';

export class AlchemicalElixir implements Consumable {
    public type: string = "consumable";
    public bulk: string = "-";
    public amount: number = 1;
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