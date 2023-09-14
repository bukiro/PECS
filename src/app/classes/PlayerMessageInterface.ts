import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Item } from 'src/app/classes/Item';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';

export interface PlayerMessageInterface {
    id: string;
    recipientId: string;
    senderId: string;
    targetId: string;
    rejectedItem: string;
    acceptedItem: string;
    itemAmount: number;
    itemInclusive: number;
    time: string;
    timeStamp: number;
    activateCondition: boolean;
    selected: boolean;
    deleted: boolean;
    turnChange: boolean;
    ttl: number;
    gainCondition: Array<DeepPartial<ConditionGain>>;
    offeredItem: Array<DeepPartial<Item>>;
    includedItems: Array<DeepPartial<Item>>;
    includedInventories: Array<DeepPartial<ItemCollection>>;
}
