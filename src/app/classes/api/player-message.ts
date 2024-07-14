import { Defaults } from 'src/libs/shared/definitions/defaults';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { v4 as uuidv4 } from 'uuid';
import { ConditionGain } from '../conditions/condition-gain';
import { Item } from '../items/item';
import { ItemCollection } from '../items/item-collection';
import { PlayerMessageBase } from './player-message-base';

const { assign, forExport, forMessage, isEqual } = setupSerializationWithHelpers<PlayerMessage>({
    primitives: [
        'id',
        'recipientId',
        'senderId',
        'targetId',
        'rejectedItem',
        'acceptedItem',
        'itemAmount',
        'itemInclusive',
        'time',
        'timeStamp',
        'activateCondition',
        'selected',
        'deleted',
        'turnChange',
        'ttl',
    ],
    serializableArrays: {
        gainCondition:
            recastFns => obj => ConditionGain.from(obj, recastFns),
    },
    messageSerializableArrays: {
        offeredItem:
            recastFns => obj => recastFns.getItemPrototype(obj, { type: obj?.type }).with(obj, recastFns),
        includedItems:
            recastFns => obj => recastFns.getItemPrototype(obj, { type: obj?.type }).with(obj, recastFns),
        includedInventories:
            recastFns => obj => ItemCollection.from(obj, recastFns),
    },
});

export class PlayerMessage implements PlayerMessageBase, MessageSerializable<PlayerMessage> {
    public id = uuidv4();
    /** The recipient is the character id of the character who will receive the message. */
    public recipientId = '';
    /** The sender is the character id of the character who sent the message. */
    public senderId = '';
    /** The target is the creature id of the creature (character, companion or familiar) for whom the message is intended. */
    public targetId = '';
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

    public static from(values: DeepPartial<PlayerMessage>, recastFns: RecastFns): PlayerMessage {
        return new PlayerMessage().with(values, recastFns);
    }

    public with(values: DeepPartial<PlayerMessage>, recastFns: RecastFns): PlayerMessage {
        assign(this, values, recastFns);

        //Cut off the time zone.
        this.time = this.time.split('(')[0].trim();

        return this;
    }

    // PlayerMessage gets exported into PlayerMessageInterface instead of DeepPartial<PlayerMessage>
    public forExport(): PlayerMessageBase {
        return {
            ...forExport(this) as PlayerMessageBase,
        };
    }

    // PlayerMessage gets exported into PlayerMessageInterface instead of DeepPartial<PlayerMessage>
    public forMessage(): PlayerMessageBase {
        return {
            ...forMessage(this) as PlayerMessageBase,
        };
    }

    public clone(recastFns: RecastFns): PlayerMessage {
        return PlayerMessage.from(this, recastFns);
    }

    public isEqual(compared: Partial<PlayerMessage>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
