import { ConditionGain } from 'src/libs/shared/conditions/util/models/condition-gain';
import { Item } from 'src/libs/shared/items/util/models/item';
import { ItemCollection } from 'src/libs/shared/items/util/models/item-collection';
import { MaybeSerialized } from 'src/libs/shared/serialization/util/models/serializable';
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
