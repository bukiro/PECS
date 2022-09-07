import { Injectable } from '@angular/core';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { AnimalCompanionsDataService } from 'src/app/core/services/data/animal-companions-data.service';
import { ConfigService } from 'src/app/core/services/config/config.service';
import { DeitiesDataService } from 'src/app/core/services/data/deities-data.service';
import { DisplayService } from 'src/app/core/services/display/display.service';
import { EffectsGenerationService } from 'src/libs/shared/effects-generation/services/effects-generation/effects-generation.service';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { FamiliarsDataService } from 'src/app/core/services/data/familiars-data.service';
import { FeatsDataService } from 'src/app/core/services/data/feats-data.service';
import { HistoryDataService } from 'src/app/core/services/data/history-data.service';
import { MessagesService } from 'src/libs/shared/services/messages/messages.service';
import { SkillsDataService } from 'src/app/core/services/data/skills-data.service';
import { TraitsDataService } from 'src/app/core/services/data/traits-data.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { ConditionsDataService } from '../data/conditions-data.service';
import { SpellsDataService } from '../data/spells-data.service';
import { ClassesDataService } from '../data/classes-data.service';
import { EffectPropertiesDataService } from 'src/app/core/services/data/effect-properties-data.service';
import { CharacterDeitiesService } from 'src/libs/shared/services/character-deities/character-deities.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { ItemsDataService } from '../data/items-data.service';
import { ItemMaterialsDataService } from '../data/item-materials-data.service';
import { ItemSpecializationsDataService } from '../data/item-specializations-data.service';
import { ItemPropertiesDataService } from '../data/item-properties-data.service';
import { StatusService } from '../status/status.service';
import { NgbPopoverConfig, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { ItemInitializationService } from 'src/libs/shared/services/item-initialization/item-initialization.service';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { BasicEquipmentService } from 'src/libs/shared/services/basic-equipment/basic-equipment.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { ConditionProcessingService } from 'src/libs/shared/processing/services/condition-processing/condition-processing.service';
import { EvaluationService } from 'src/libs/shared/services/evaluation/evaluation.service';
import { EquipmentConditionsService } from 'src/libs/shared/effects-generation/services/equipment-conditions/equipment-conditions.service';
import { OnceEffectsService } from 'src/libs/shared/services/once-effects/once-effects.service';
import { MessageProcessingService } from 'src/libs/shared/processing/services/message-processing/message-processing.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { InventoryItemProcessingService } from 'src/libs/shared/processing/services/inventory-item-processing/inventory-item-processing.service';
import { ActivitiesProcessingService } from 'src/libs/shared/processing/services/activities-processing/activities-processing.service';
import { SpellProcessingService } from 'src/libs/shared/processing/services/spell-processing/spell-processing.service';
import { SpellActivityProcessingSharedService } from 'src/libs/shared/processing/services/spell-activity-processing-shared/spell-activity-processing-shared.service';
import { CharacterLoadingService } from 'src/libs/shared/saving-loading/services/character-loading/character-loading.service';
import { FeatProcessingService } from 'src/app/character-creation/services/feat-processing/feat-processing.service';
import { ProcessingServiceProvider } from '../processing-service-provider/processing-service-provider.service';
import { ItemActivationProcessingService } from 'src/libs/shared/processing/services/item-activation-processing/item-activation-processing.service';

@Injectable({
    providedIn: 'root',
})
export class AppInitService {

    constructor(
        private readonly _extensionsService: ExtensionsService,
        private readonly _configService: ConfigService,
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
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _statusService: StatusService,
        private readonly _itemInitializationService: ItemInitializationService,
        private readonly _refreshService: RefreshService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        private readonly _basicEquipmentService: BasicEquipmentService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _conditionProcessingService: ConditionProcessingService,
        private readonly _messageProcessingService: MessageProcessingService,
        private readonly _equipmentConditionsService: EquipmentConditionsService,
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
        popoverConfig: NgbPopoverConfig,
        tooltipConfig: NgbTooltipConfig,
    ) {
        popoverConfig.autoClose = 'outside';
        popoverConfig.container = 'body';
        popoverConfig.openDelay = Defaults.tooltipDelay;
        popoverConfig.placement = 'auto';
        popoverConfig.popoverClass = 'list-item sublist';
        popoverConfig.triggers = 'hover:click';
        tooltipConfig.placement = 'auto';
        tooltipConfig.container = 'body';
        tooltipConfig.openDelay = Defaults.tooltipDelay;
        tooltipConfig.triggers = 'hover:click';

        this.init();
    }

    public init(): void {
        this._statusService.setLoadingStatus('Loading extensions');
        this._extensionsService.initialize();
        this._configService.initialize();
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
        DisplayService.setPageHeight();

        const waitForFileServices = setInterval(() => {
            if (!this._extensionsService.stillLoading && !this._configService.stillLoading) {
                clearInterval(waitForFileServices);
                this._statusService.setLoadingStatus('Initializing content');

                // Initialize itemsDataService and activitiesDataService first.
                // They provide restoration functions for other services.
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
                this._messagesService.initialize();
                this._customEffectPropertiesService.initialize();
                this._effectsGenerationService.initialize();

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
                this._characterLoadingService.initialize(this);
                this._characterLoadingService.loadOrResetCharacter();
            }
        }, Defaults.waitForServiceDelay);
    }

    public reset(): void {
        this._traitsDataService.reset();
        this._activitiesDataService.reset();
        this._featsDataService.reset();
        this._characterFeatsService.reset();
        this._conditionsDataService.reset();
        this._skillsDataService.reset();
        this._itemsDataService.reset();
        this._itemSpecializationsDataService.reset();
        this._characterDeitiesService.reset();
        this._animalCompanionsDataService.reset();
        this._familiarsDataService.reset();
        this._messagesService.reset();
    }

}
