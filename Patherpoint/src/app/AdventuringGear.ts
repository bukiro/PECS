import { Equipment } from './Equipment';

export class AdventuringGear extends Equipment {
    //Adventuring Gear should be type "adventuringgear" to be found in the database
    public type: string = "adventuringgear";
    //Number of items of this kind in your inventory. Many adventuring items can stack.
    //Items that can be equipped or invested get duplicated and not stacked - the amount remains 1.
    public amount: number = 1;
    //Some Items get bought in stacks. Stack defines how many you buy at once,
    //and how many make up one instance of the items Bulk.
    public stack: number = 1;
    //How is this item used/worn/applied? Example: held in 1 hand
    public usage: string = "";
    //How many hands need to be free to use this item?
    public hands: string = "";
    //Adventuring Gear can usually not be equipped or invested, but with exceptions.
    public equippable: boolean = false;
}