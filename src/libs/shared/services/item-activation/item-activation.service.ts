import { Injectable } from '@angular/core';
import { Consumable } from 'src/app/classes/Consumable';
import { Creature } from 'src/app/classes/Creature';
import { ItemActivationProcessingService } from '../item-activation-processing/item-activation-processing.service';
import { RefreshService } from '../refresh/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class ItemActivationService {

    constructor(
        private readonly _itemActivationProcessingService: ItemActivationProcessingService,
        private readonly _refreshService: RefreshService,
    ) { }

    public useConsumable(creature: Creature, item: Consumable, preserveItem = false): void {
        if (!preserveItem) {
            item.amount--;
        }

        this._itemActivationProcessingService.processConsumableActivation(creature, item);
        this._refreshService.prepareChangesByItem(
            creature,
            item,
        );
        this._refreshService.prepareDetailToChange(creature.type, 'inventory');
    }

}
