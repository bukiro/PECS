import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/creatures/creature';
import { Consumable } from 'src/app/classes/items/consumable';
import { ProcessingServiceProvider } from '../../../../libs/app-shell/domain/services/processing-service-provider.service';

@Injectable({
    providedIn: 'root',
})
export class ItemActivationService {

    constructor(
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public useConsumable(creature: Creature, item: Consumable, preserveItem = false): void {
        if (!preserveItem) {
            item.amount--;
        }

        this._psp.itemActivationProcessingService?.processConsumableActivation(creature, item);
    }

}
