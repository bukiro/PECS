import { ConditionGain } from 'src/app/classes/ConditionGain';
import { v4 as uuidv4 } from 'uuid';
import { Item } from 'src/app/classes/Item';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';

export class PlayerMessage {
    public id = uuidv4();
    /** The recipient is the character id of the character who will receive the message. */
    public recipientId = '';
    /** The sender is the character id of the character who sent the message. */
    public senderId = '';
    /** The target is the creature id of the creature (character, companion or familiar) for whom the message is intended. */
    public targetId = '';
    /** gainCondition can contain ONE condition that is applied to the target creature. Other conditions are ignored. */
    public gainCondition: Array<ConditionGain> = [];
    /**
     * offeredItem can contain ONE item that is offered or automatically given to the target character. Other items are ignored.
     * Any items granted by this and any inventories included in this item or its granted items
     * are saved in includedItems and includedInventories.
     */
    public offeredItem: Array<Item> = [];
    public includedItems: Array<Item> = [];
    public includedInventories: Array<ItemCollection> = [];
    public rejectedItem = '';
    /**
     * If the item was accepted,
     * its id and the amount is sent back so it can be dropped or deducted from the sending player's inventories.
     */
    public acceptedItem = '';
    public itemAmount = 0;
    public itemInclusive = 0;
    public time = '';
    public timeStamp = 0;
    /** Start a condition? False will try to end a condition. */
    public activateCondition = true;
    public selected = true;
    public deleted = false;
    public turnChange = false;
    public ttl = Defaults.playerMessageTTL;

    public recast(recastFns: RecastFns): PlayerMessage {
        this.gainCondition = this.gainCondition.map(obj => Object.assign(new ConditionGain(), obj).recast(recastFns));
        this.offeredItem = this.offeredItem.map(obj => recastFns.item(obj).recast(recastFns));
        this.includedItems = this.includedItems.map(obj => recastFns.item(obj).recast(recastFns));
        this.includedInventories =
            this.includedInventories.map(obj => Object.assign(new ItemCollection(), obj).recast(recastFns));

        return this;
    }

    public clone(recastFns: RecastFns): PlayerMessage {
        return Object.assign<PlayerMessage, PlayerMessage>(new PlayerMessage(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }
}
