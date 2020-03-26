import { Item } from './Item';

export class AdventuringGear implements Item {
    public type: string = "adventuringgear";
    public name: string = "";
    public level: number = 0;
    public bulk: string = "";
    //Some items have a different bulk when you are carrying them instead of wearing them, like backpacks
    public carryingBulk: string = "";
    public price: number = 0;
    public amount: number = 1;
    public stack: number = 1;
    public equip: boolean = false;
    public invested: boolean = false;
    public usage: string = "";
    public hands: string = "";
    public desc: string = "";
    public hint: string = "";
    public showon: string = "";
    public equippable: boolean = false;
    public subType: string = "";
    public subTypeDesc: string = "";
    public gainItems = [];
    public gainActivity = [];
    public effects = [];
    public specialEffects = [];
    public traits: string[] = [];
}