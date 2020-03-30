import { ConditionGain } from './ConditionGain';
import { Item } from './Item';
import { ActivityGain } from './ActivityGain';
import { ItemGain } from './ItemGain';
import { EffectGain } from './EffectGain';

export class HeldItem implements Item {
    public type: string = "helditems";
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
    public gainActivity: string[] = [];
    public gainItems: ItemGain[] = [];
    public effects: EffectGain[] = [];
    public specialEffects: EffectGain[] = [];
    public traits: string[] = [];
}