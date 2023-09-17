import { Injectable } from '@angular/core';
import { Defaults } from '../../definitions/defaults';
import { NgbPopoverConfig, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { ItemsDataService } from '../data/items-data.service';
import { ItemMaterialsDataService } from '../data/item-materials-data.service';
import { ItemSpecializationsDataService } from '../data/item-specializations-data.service';
import { ItemPropertiesDataService } from '../data/item-properties-data.service';
import { ItemInitializationService } from 'src/libs/shared/services/item-initialization/item-initialization.service';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { BasicEquipmentService } from 'src/libs/shared/services/basic-equipment/basic-equipment.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { ConditionProcessingService } from 'src/libs/shared/processing/services/condition-processing/condition-processing.service';
import { EvaluationService } from 'src/libs/shared/services/evaluation/evaluation.service';
import { EquipmentConditionsService } from 'src/libs/shared/services/equipment-conditions/equipment-conditions.service';
import { OnceEffectsService } from 'src/libs/shared/services/once-effects/once-effects.service';
import { MessageProcessingService } from 'src/libs/shared/processing/services/message-processing/message-processing.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { InventoryItemProcessingService } from 'src/libs/shared/processing/services/inventory-item-processing/inventory-item-processing.service';
import { ActivitiesProcessingService } from 'src/libs/shared/processing/services/activities-processing/activities-processing.service';
import { SpellProcessingService } from 'src/libs/shared/processing/services/spell-processing/spell-processing.service';
import { FeatProcessingService } from 'src/libs/character-creation/services/feat-processing/feat-processing.service';
import { ItemActivationProcessingService } from '../../processing/services/item-activation-processing/item-activation-processing.service';
import { SpellActivityProcessingSharedService } from '../../processing/services/spell-activity-processing-shared/spell-activity-processing-shared.service';
import { ProcessingServiceProvider } from '../processing-service-provider/processing-service-provider.service';
import { CharacterLoadingService } from '../../character-loading/services/character-loading/character-loading.service';
import { EffectsGenerationService } from '../../effects-generation/services/effects-generation/effects-generation.service';
import { AbilitiesDataService } from '../data/abilities-data.service';
import { ActivitiesDataService } from '../data/activities-data.service';
import { AnimalCompanionsDataService } from '../data/animal-companions-data.service';
import { ClassesDataService } from '../data/classes-data.service';
import { ConditionsDataService } from '../data/conditions-data.service';
import { DeitiesDataService } from '../data/deities-data.service';
import { EffectPropertiesDataService } from '../data/effect-properties-data.service';
import { DataService } from '../data/data.service';
import { FamiliarsDataService } from '../data/familiars-data.service';
import { FeatsDataService } from '../data/feats-data.service';
import { HistoryDataService } from '../data/history-data.service';
import { SkillsDataService } from '../data/skills-data.service';
import { SpellsDataService } from '../data/spells-data.service';
import { TraitsDataService } from '../data/traits-data.service';
import { DisplayService } from '../display/display.service';
import { MessagesService } from '../messages/messages.service';
import { ApiStatusKey } from '../../definitions/apiStatusKey';
import { filter, take } from 'rxjs';
import { DocumentStyleService } from '../document-style/document-style.service';
import { ConfigService } from '../config/config.service';
import { Store } from '@ngrx/store';
import { selectDataStatus } from 'src/libs/store/status/status.selectors';
import { setDataStatus } from 'src/libs/store/status/status.actions';
import { closeAllMenus } from 'src/libs/store/menu/menu.actions';
import { AnimalCompanionLevelsService } from '../animal-companion-level/animal-companion-level.service';
import { EquipmentPropertiesService } from '../equipment-properties/equipment-properties.service';
import { ItemTraitsService } from '../item-traits/item-traits.service';

@Injectable({
    providedIn: 'root',
})
export class AppInitService {

    constructor(
        //Initialize these services simply by injecting them.
        _configService: ConfigService,
        _extensionsService: DataService,
        _documentStyleService: DocumentStyleService,
        _animalCompanionLevelsService: AnimalCompanionLevelsService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _abilitiesDataService: AbilitiesDataService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _featsDataService: FeatsDataService,
        private readonly _historyDataService: HistoryDataService,
        private readonly _classesDataService: ClassesDataService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _itemPropertiesDataService: ItemPropertiesDataService,
        private readonly _itemMaterialsDataService: ItemMaterialsDataService,
        private readonly _itemSpecializationsDataService: ItemSpecializationsDataService,
        private readonly _deitiesDataService: DeitiesDataService,
        private readonly _animalCompanionsDataService: AnimalCompanionsDataService,
        private readonly _familiarsDataService: FamiliarsDataService,
        private readonly _messagesService: MessagesService,
        private readonly _customEffectPropertiesService: EffectPropertiesDataService,
        private readonly _effectsGenerationService: EffectsGenerationService,
        private readonly _effectsPropertiesDataService: EffectPropertiesDataService,
        private readonly _itemInitializationService: ItemInitializationService,
        private readonly _refreshService: RefreshService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        private readonly _basicEquipmentService: BasicEquipmentService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _conditionProcessingService: ConditionProcessingService,
        private readonly _messageProcessingService: MessageProcessingService,
        private readonly _equipmentConditionsService: EquipmentConditionsService,
        private readonly _equipmentPropertiesService: EquipmentPropertiesService,
        private readonly _onceEffectsService: OnceEffectsService,
        private readonly _evaluationService: EvaluationService,
        private readonly _inventoryService: InventoryService,
        private readonly _inventoryItemProcessingService: InventoryItemProcessingService,
        private readonly _activitiesProcessingService: ActivitiesProcessingService,
        private readonly _spellProcessingService: SpellProcessingService,
        private readonly _spellActivityProcessingSharedService: SpellActivityProcessingSharedService,
        private readonly _characterLoadingService: CharacterLoadingService,
        private readonly _featProcessingService: FeatProcessingService,
        private readonly _processingServiceProvider: ProcessingServiceProvider,
        private readonly _itemActivationProcessingService: ItemActivationProcessingService,
        private readonly _itemTraitsService: ItemTraitsService,
        private readonly _store$: Store,
        popoverConfig: NgbPopoverConfig,
        tooltipConfig: NgbTooltipConfig,
    ) {
        popoverConfig.autoClose = 'outside';
        popoverConfig.container = 'body';
        popoverConfig.openDelay = Defaults.tooltipDelay;
        popoverConfig.placement = 'auto';
        popoverConfig.popoverClass = 'pecs-popover';
        popoverConfig.triggers = 'hover:click';
        tooltipConfig.placement = 'auto';
        tooltipConfig.container = 'body';
        tooltipConfig.openDelay = Defaults.tooltipDelay;
        tooltipConfig.triggers = 'hover:click';

        this.init();
    }

    public init(): void {
        DisplayService.setPageHeight();

        this._processingServiceProvider.registerServices(
            this._activitiesProcessingService,
            this._conditionProcessingService,
            this._featProcessingService,
            this._inventoryItemProcessingService,
            this._itemActivationProcessingService,
            this._messageProcessingService,
            this._spellActivityProcessingSharedService,
            this._spellProcessingService,
        );

        this._store$.select(selectDataStatus)
            .pipe(
                filter(dataStatus => dataStatus.key !== ApiStatusKey.Initializing),
                take(1),
            )
            .subscribe(() => {
                // Initialize all data services after the extension service.
                // Start with itemsDataService and activitiesDataService; they provide restoration functions for other services.
                this._itemsDataService.initialize(
                    this._itemInitializationService,
                    this._basicEquipmentService,
                );

                this._activitiesDataService.initialize();
                this._abilitiesDataService.initialize();
                this._animalCompanionsDataService.initialize();
                this._classesDataService.initialize();
                this._conditionsDataService.initialize();
                this._deitiesDataService.initialize();
                this._effectsPropertiesDataService.initialize();
                this._familiarsDataService.initialize();
                this._featsDataService.initialize();
                this._historyDataService.initialize();
                this._itemMaterialsDataService.initialize();
                this._itemPropertiesDataService.initialize();
                this._itemSpecializationsDataService.initialize();
                this._skillsDataService.initialize();
                this._spellsDataService.initialize();
                this._traitsDataService.initialize();

                this._store$.dispatch(setDataStatus({ status: { key: ApiStatusKey.Ready } }));

                // Initialize other services.

                this._customEffectPropertiesService.initialize();
                this._effectsGenerationService.initialize();
                this._equipmentPropertiesService.initialize();
                this._itemTraitsService.initialize();

                // Pass some services to other services that shouldn't have them in their dependency injection.
                this._refreshService.initialize(this._creatureActivitiesService);
                this._equipmentConditionsService.initialize(this._evaluationService);
                this._onceEffectsService.initialize(this._evaluationService);
                this._inventoryService.initialize(
                    this._basicEquipmentService,
                );
                this._creatureConditionsService.initialize(
                    this._evaluationService,
                );
                this._characterLoadingService.initialize(this.reset.bind(this));
            });
    }

    public reset(): void {
        this._store$.dispatch(closeAllMenus());
        this._traitsDataService.reset();
        this._activitiesDataService.reset();
        this._featsDataService.reset();
        this._conditionsDataService.reset();
        this._skillsDataService.reset();
        this._itemsDataService.reset();
        this._itemSpecializationsDataService.reset();
        this._animalCompanionsDataService.reset();
        this._familiarsDataService.reset();
        this._messagesService.reset();
    }

}
