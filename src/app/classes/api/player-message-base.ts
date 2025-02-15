import { MaybeSerialized } from 'src/libs/shared/definitions/interfaces/serializable';
import { ConditionGain } from '../conditions/condition-gain';
import { Item } from '../items/item';
import { ItemCollection } from '../items/item-collection';
import { PlayerMessage } from './player-message';

export interface PlayerMessageBase extends MaybeSerialized<PlayerMessage> {
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
    gainCondition: Array<MaybeSerialized<ConditionGain>>;
    offeredItem: Array<MaybeSerialized<Item>>;
    includedItems: Array<MaybeSerialized<Item>>;
    includedInventories: Array<MaybeSerialized<ItemCollection>>;
}
