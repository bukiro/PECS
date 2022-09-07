import { Injectable } from '@angular/core';
import { FeatProcessingService } from 'src/app/character-creation/services/feat-processing/feat-processing.service';
import { ActivitiesProcessingService } from 'src/libs/shared/processing/services/activities-processing/activities-processing.service';
import { ConditionProcessingService } from 'src/libs/shared/processing/services/condition-processing/condition-processing.service';
import { InventoryItemProcessingService } from 'src/libs/shared/processing/services/inventory-item-processing/inventory-item-processing.service';
import { ItemActivationProcessingService } from 'src/libs/shared/processing/services/item-activation-processing/item-activation-processing.service';
import { MessageProcessingService } from 'src/libs/shared/processing/services/message-processing/message-processing.service';
import { SpellActivityProcessingSharedService } from 'src/libs/shared/processing/services/spell-activity-processing-shared/spell-activity-processing-shared.service';
import { SpellProcessingService } from 'src/libs/shared/processing/services/spell-processing/spell-processing.service';

@Injectable({
    providedIn: 'root',
})
export class ProcessingServiceProvider {

    private _activitiesProcessingService?: ActivitiesProcessingService;
    private _conditionProcessingService?: ConditionProcessingService;
    private _featProcessingService?: FeatProcessingService;
    private _inventoryItemProcessingService?: InventoryItemProcessingService;
    private _itemActivationProcessingService?: ItemActivationProcessingService;
    private _messageProcessingService?: MessageProcessingService;
    private _spellActivityProcessingSharedService?: SpellActivityProcessingSharedService;
    private _spellProcessingService?: SpellProcessingService;

    public get activitiesProcessingService(): ActivitiesProcessingService | undefined {
        if (!this._activitiesProcessingService) {
            console.error('activitiesProcessingService was called before initialization in ProcessingServiceProvider!');
        }

        return this._activitiesProcessingService;
    }

    public get conditionProcessingService(): ConditionProcessingService | undefined {
        if (!this._conditionProcessingService) {
            console.error('conditionProcessingService was called before initialization in ProcessingServiceProvider!');
        }

        return this._conditionProcessingService;
    }

    public get featProcessingService(): FeatProcessingService | undefined {
        if (!this._featProcessingService) {
            console.error('featProcessingService was called before initialization in ProcessingServiceProvider!');
        }

        return this._featProcessingService;
    }

    public get inventoryItemProcessingService(): InventoryItemProcessingService | undefined {
        if (!this._inventoryItemProcessingService) {
            console.error('inventoryItemProcessingService was called before initialization in ProcessingServiceProvider!');
        }

        return this._inventoryItemProcessingService;
    }

    public get itemActivationProcessingService(): ItemActivationProcessingService | undefined {
        if (!this._itemActivationProcessingService) {
            console.error('itemActivationProcessingService was called before initialization in ProcessingServiceProvider!');
        }

        return this._itemActivationProcessingService;
    }

    public get messageProcessingService(): MessageProcessingService | undefined {
        if (!this._messageProcessingService) {
            console.error('messageProcessingService was called before initialization in ProcessingServiceProvider!');
        }

        return this._messageProcessingService;
    }

    public get spellActivityProcessingSharedService(): SpellActivityProcessingSharedService | undefined {
        if (!this._spellActivityProcessingSharedService) {
            console.error('spellActivityProcessingSharedService was called before initialization in ProcessingServiceProvider!');
        }

        return this._spellActivityProcessingSharedService;
    }

    public get spellProcessingService(): SpellProcessingService | undefined {
        if (!this._spellProcessingService) {
            console.error('spellProcessingService was called before initialization in ProcessingServiceProvider!');
        }

        return this._spellProcessingService;
    }

    public registerServices(
        activitiesProcessingService: ActivitiesProcessingService,
        conditionProcessingService: ConditionProcessingService,
        featProcessingService: FeatProcessingService,
        inventoryItemProcessingService: InventoryItemProcessingService,
        itemActivationProcessingService: ItemActivationProcessingService,
        messageProcessingService: MessageProcessingService,
        spellActivityProcessingSharedService: SpellActivityProcessingSharedService,
        spellProcessingService: SpellProcessingService,
    ): void {
        this._activitiesProcessingService = activitiesProcessingService;
        this._conditionProcessingService = conditionProcessingService;
        this._featProcessingService = featProcessingService;
        this._inventoryItemProcessingService = inventoryItemProcessingService;
        this._itemActivationProcessingService = itemActivationProcessingService;
        this._messageProcessingService = messageProcessingService;
        this._spellActivityProcessingSharedService = spellActivityProcessingSharedService;
        this._spellProcessingService = spellProcessingService;
    }

}
