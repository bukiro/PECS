import { effect, inject, Injectable } from '@angular/core';
import { Defaults } from '../../../../libs/shared/common/util/models/defaults';
import { NgbPopoverConfig, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { ItemMaterialsDataService } from '../../../../libs/shared/materials/domain/item-materials-data.service';
import { ItemSpecializationsDataService } from '../data/item-specializations-data.service';
import { ItemPropertiesDataService } from '../data/item-properties-data.service';
import { ItemActivationProcessingService } from '../../processing/services/item-activation-processing/item-activation-processing.service';
import { SpellActivityProcessingSharedService } from '../../processing/services/spell-activity-processing-shared/spell-activity-processing-shared.service';
import { ProcessingServiceProvider } from '../../../../libs/app-shell/domain/services/processing-service-provider.service';
import { CharacterLoadingService } from '../../../../libs/character-selection/domain/services/character-loading.service';
import { EffectsGenerationService } from '../../effects-generation/services/effects-generation/effects-generation.service';
import { AbilitiesDataService } from '../../../../libs/shared/abilities/domain/services/abilities-data.service';
import { ActivitiesDataService } from '../../../../libs/shared/activities/domain/services/activities-data.service';
import { AnimalCompanionDataService } from '../../../../libs/shared/animal-companion/domain/services/animal-companion-data.service';
import { ClassesDataService } from '../data/classes-data.service';
import { ConditionsDataService } from '../../../../libs/shared/conditions/domain/services/conditions-data.service';
import { DeitiesDataService } from '../../../../libs/shared/deities/domain/services/deities-data.service';
import { EffectPropertiesDataService } from '../data/effect-properties-data.service';
import { DataService } from '../../../../libs/shared/content-data/domain/services/data.service';
import { HistoryDataService } from '../../../../libs/shared/character/domain/services/history-data.service';
import { SkillsDataService } from '../../../../libs/shared/skills/domain/services/skills-data.service';
import { SpellsDataService } from '../../../../libs/shared/spells/domain/services/spells-data.service';
import { TraitsDataService } from '../../../../libs/shared/traits/domain/services/traits-data.service';
import { DisplayService } from '../../../../libs/shared/app-status/domain/services/display.service';
import { MessagesService } from '../messages/messages.service';
import { ApiStatusKey } from '../../../../libs/shared/api/util/models/api-status-key';
import { DocumentStyleService } from '../document-style/document-style.service';
import { ConfigService } from '../../../../libs/shared/app-status/domain/services/config.service';
import { EquipmentPropertiesService } from '../equipment-properties/equipment-properties.service';
import { ItemTraitsService } from '../item-traits/item-traits.service';
import { AuthService } from '../../../../libs/auth/domain/services/auth.service';
import { CreatureConditionsCleanupService } from '../creature-conditions/creature-conditions-cleanup.service';
import { StatusStore } from 'src/libs/shared/app-status/domain/stores/status.store';
import { ActivitiesProcessingService } from 'src/libs/shared/activities/domain/services/activities-processing.service';
import { CreatureConditionsService } from 'src/libs/shared/conditions/domain/services/creature-conditions.service';
import { FeatsDataService } from 'src/libs/shared/feats/domain/services/feats-data.service';
import { BasicEquipmentService } from 'src/libs/shared/items/domain/services/basic-equipment.service';
import { InventoryService } from 'src/libs/shared/items/domain/services/inventory.service';
import { ItemInitializationService } from 'src/libs/shared/items/domain/services/item-initialization.service';
import { ItemsDataService } from 'src/libs/shared/items/domain/services/items-data.service';
import { EvaluationService } from 'src/libs/shared/value-formulas/domain/services/evaluation.service';
import { FeatProcessingService } from 'src/old/character-creation/services/feat-processing/feat-processing.service';
import { ConditionProcessingService } from '../../processing/services/condition-processing/condition-processing.service';
import { InventoryItemProcessingService } from '../../processing/services/inventory-item-processing/inventory-item-processing.service';
import { MessageProcessingService } from '../../processing/services/message-processing/message-processing.service';
import { SpellProcessingService } from '../../processing/services/spell-processing/spell-processing.service';
import { EquipmentConditionsService } from '../equipment-conditions/equipment-conditions.service';
import { OnceEffectsService } from '../once-effects/once-effects.service';
import { MenuStore } from 'src/libs/shared/app-status/domain/stores/menu.store';

@Injectable({
    providedIn: 'root',
})
export class AppInitService {

        private readonly _statusStore = inject(StatusStore);
        private readonly _menuStore = inject(MenuStore);

        constructor(
        //Initialize these services simply by injecting them.
            _configService: ConfigService,
            _extensionsService: DataService,
            _documentStyleService: DocumentStyleService,
            _animalCompanionDataService: AnimalCompanionDataService,
            _creatureConditionsCleanupService: CreatureConditionsCleanupService,
            private readonly _authService: AuthService,
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
            private readonly _animalCompanionsDataService: AnimalCompanionDataService,
            private readonly _messagesService: MessagesService,
            private readonly _customEffectPropertiesService: EffectPropertiesDataService,
            private readonly _effectsGenerationService: EffectsGenerationService,
            private readonly _effectsPropertiesDataService: EffectPropertiesDataService,
            private readonly _itemInitializationService: ItemInitializationService,
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

            const initAuthEffect = effect(() => {
                if (this._statusStore.config().key === ApiStatusKey.Ready) {

                    // Initialize the auth service when the config service is ready.
                    this._authService.initialize();

                    initAuthEffect.destroy();
                }
            });

            const initCharacterLoadingEffect = effect(() => {
                if (
                    this._statusStore.auth().key === ApiStatusKey.Ready
                    && this._statusStore.savegames().key === ApiStatusKey.Ready
                ) {
                    // Initialize the loading service when the auth and savegames services are ready.
                    this._characterLoadingService.initialize(this.reset.bind(this));

                    initCharacterLoadingEffect.destroy();
                }
            });

            const initDataBasedServicesEffect = effect(() => {
                if (this._statusStore.data().key === ApiStatusKey.Ready) {
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
                    this._featsDataService.initialize();
                    this._historyDataService.initialize();
                    this._itemMaterialsDataService.initialize();
                    this._itemPropertiesDataService.initialize();
                    this._itemSpecializationsDataService.initialize();
                    this._skillsDataService.initialize();
                    this._spellsDataService.initialize();
                    this._traitsDataService.initialize();

                    // Initialize other services.

                    this._customEffectPropertiesService.initialize();
                    this._effectsGenerationService.initialize();
                    this._equipmentPropertiesService.initialize();
                    this._itemTraitsService.initialize();

                    // Pass some services to other services that shouldn't have them in their dependency injection.
                    this._equipmentConditionsService.initialize(this._evaluationService);
                    this._onceEffectsService.initialize(this._evaluationService);
                    this._inventoryService.initialize(
                        this._basicEquipmentService,
                    );
                    this._creatureConditionsService.initialize(
                        this._evaluationService,
                    );

                    initDataBasedServicesEffect.destroy();
                }
            });
        }

        public reset(): void {
            this._menuStore.closeAllMenus();

            this._traitsDataService.reset();
            this._activitiesDataService.reset();
            this._featsDataService.reset();
            this._conditionsDataService.reset();
            this._skillsDataService.reset();
            this._itemsDataService.reset();
            this._itemSpecializationsDataService.reset();
            this._animalCompanionsDataService.reset();
            this._messagesService.reset();
        }

}
