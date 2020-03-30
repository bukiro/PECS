import { ConditionGain } from './ConditionGain';
import { Item } from './Item';

export class Consumable extends Item {
    //Consumables can normally not be equipped.
    public equippable: boolean = false;
    //Some Items get bought in stacks. Stack defines how many you buy at once,
    //and how many make up one instance of the items Bulk.
    public stack: number = 1;
    //How many Actions does it take to use this item?
    //Usually "Free", "Reaction", "1", "2" or "3", but can be something special like "1 hour"
    public actions: string = "1";
    //What needs to be done to activate? Example: "Command", "Manipulate"
    public activationType: string = "";
    //List ConditionGain for every condition that you gain from using this item
    public gainCondition: ConditionGain[] = [];
}
