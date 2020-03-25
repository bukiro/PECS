import { ConditionGain } from './ConditionGain';
import { Item } from './Item';

export class HeldItem implements Item {
    public type: string = "consumable";
    public name: string = "";
    public level: number = 0;
    public bulk: string = "";
    public price: number = 0;
    public actions: string = "";
    public activationType: string = "";
    public desc: string = "";
    public subType: string = "";
    public subTypeDesc: string = "";
    public equip: boolean = false;
    public equippable: boolean = false;
    public invested: boolean = false;
    public showon: string = "";
    public hint: string = "";
    public effects = [];
    public specialEffects = [];
    public gainActivity: string[] = [];
    public gainCondition: ConditionGain[];
    public traits: string[] = [];
}