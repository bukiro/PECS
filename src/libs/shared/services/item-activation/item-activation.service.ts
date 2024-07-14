import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { Consumable } from 'src/app/classes/items/consumable';
import { ProcessingServiceProvider } from '../processing-service-provider/processing-service-provider.service';
import { RefreshService } from '../refresh/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class ItemActivationService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public useConsumable(creature: Creature, item: Consumable, preserveItem = false): void {
        if (!preserveItem) {
            item.amount--;
        }

        this._psp.itemActivationProcessingService?.processConsumableActivation(creature, item);
        this._refreshService.prepareChangesByItem(
            creature,
            item,
        );
        this._refreshService.prepareDetailToChange(creature.type, 'inventory');
    }

}
