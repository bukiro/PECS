import { ConditionGain } from 'src/app/classes/ConditionGain';
import { v4 as uuidv4 } from 'uuid';
import { Item } from 'src/app/classes/Item';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { TypeService } from 'src/app/services/type.service';
import { ItemsService } from 'src/app/services/items.service';

export class PlayerMessage {
    public id = uuidv4();
    //The recipient is the character id of the character who will receive the message.
    public recipientId: string = "";
    //The sender is the character id of the character who sent the message.
    public senderId: string = "";
    //The target is the creature id of the creature (character, companion or familiar) for whom the message is intended.
    public targetId: string = "";
    //gainCondition can contain ONE condition that is applied to the target creature.
    public gainCondition: ConditionGain[] = [];
    //offeredItem can contain ONE item that is offered or automatically given to the target character.
    //Any items granted by this and any inventories included in this item or its granted items are saved in includedItems and includedInventories.
    public offeredItem: Item[] = [];
    public includedItems: Item[] = [];
    public includedInventories: ItemCollection[] = [];
    public rejectedItem: string = "";
    //If the item was accepted, its id and the amount is sent back so it can be dropped or deducted from the sending player's inventories.
    public acceptedItem: string = "";
    public itemAmount: number = 0;
    public itemInclusive: number = 0;
    public time: string = "";
    public timeStamp: number = 0;
    //Start a condition? False will try to end a condition.
    public activateCondition: boolean = true;
    public selected: boolean = true;
    public deleted: boolean = false;
    public turnChange: boolean = false;
    public ttl: number = 600;
    recast(typeService: TypeService, itemsService: ItemsService) {
        this.gainCondition = this.gainCondition.map(obj => Object.assign(new ConditionGain(), obj).recast());
        this.offeredItem = this.offeredItem.map(obj => Object.assign(new Item(), obj).recast(typeService, itemsService));
        this.includedItems = this.includedItems.map(obj => Object.assign(new Item(), obj).recast(typeService, itemsService));
        this.includedInventories = this.includedInventories.map(obj => Object.assign(new ItemCollection(), obj).recast(typeService, itemsService));
        return this;
    }
}
