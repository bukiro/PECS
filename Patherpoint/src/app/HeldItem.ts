import { ConditionGain } from './ConditionGain';
import { Item } from './Item';

export class HeldItem implements Item {
    public type: string = "consumable";
    public name: string = "";
    public level: string = "-";
    public bulk: string = "-";
    public price: number = 0;
    public desc: string = "";
    public subType: string = "";
    public subTypeDesc: string = "";
    public equip: boolean = false;
    public equippable: boolean = false;
    public invested: boolean = false;
    public effects = [];
    public specialEffects = [];
    public gainActivity: string[] = [];
    public gainCondition: ConditionGain[];
    public traits: string[] = [];
}