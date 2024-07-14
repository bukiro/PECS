import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { ConditionGain } from '../conditions/condition-gain';
import { Item } from '../items/item';
import { ItemCollection } from '../items/item-collection';

export interface PlayerMessageBase {
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
