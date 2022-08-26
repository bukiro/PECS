import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { SkillsDataService } from 'src/app/core/services/data/skills-data.service';
import { FeatsDataService } from 'src/app/core/services/data/feats-data.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { DeitiesDataService } from 'src/app/core/services/data/deities-data.service';
import { AnimalCompanionsDataService } from 'src/app/core/services/data/animal-companions-data.service';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { SavegamesService } from 'src/libs/shared/saving-loading/services/savegames/savegames.service';
import { FamiliarsDataService } from 'src/app/core/services/data/familiars-data.service';
import { ConfigService } from 'src/app/core/services/config/config.service';
import { MessagesService } from 'src/libs/shared/services/messages/messages.service';
import { ToastService } from 'src/libs/shared/services/toast/toast.service';
import { NgbPopoverConfig, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { EvaluationService } from 'src/libs/shared/services/evaluation/evaluation.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { ActivitiesProcessingService } from 'src/libs/shared/services/activities-processing/activities-processing.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { ArmorClassService } from 'src/libs/defense/services/armor-class/armor-class.service';
import { HealthService } from 'src/libs/shared/services/health/health.service';
import { ArmorPropertiesService } from 'src/libs/shared/services/armor-properties/armor-properties.service';
import { ActivityGainPropertiesService } from 'src/libs/shared/services/activity-gain-properties/activity-gain-properties.service';
import { AnimalCompanionLevelsService } from 'src/libs/shared/services/animal-companion-level/animal-companion-level.service';
import { FeatTakingService } from '../character-creation/services/feat-taking/feat-taking.service';
import { CharacterLoreService } from 'src/libs/shared/services/character-lore/character-lore.service';
import { ConditionsDataService } from '../core/services/data/conditions-data.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { ItemGrantingService } from 'src/libs/shared/services/item-granting/item-granting.service';
import { ClassesDataService } from '../core/services/data/classes-data.service';
import { CharacterDeitiesService } from 'src/libs/shared/services/character-deities/character-deities.service';
import { ObjectEffectsGenerationService } from 'src/libs/shared/effects-generation/services/object-effects-generation/object-effects-generation';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';
import { StatusService } from '../core/services/status/status.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CreatureFeatsService } from 'src/libs/shared/services/creature-feats/creature-feats.service';
import { ItemsDataService } from '../core/services/data/items-data.service';
import { ItemInitializationService } from 'src/libs/shared/services/item-initialization/item-initialization.service';
import { ItemSpecializationsDataService } from '../core/services/data/item-specializations-data.service';
import { ItemTransferService } from 'src/libs/shared/services/item-transfer/item-transfer.service';
import { CreatureEquipmentService } from 'src/libs/shared/services/creature-equipment/creature-equipment.service';
import { ItemActivationProcessingService } from 'src/libs/shared/services/item-activation-processing/item-activation-processing.service';
import { SettingsService } from '../core/services/settings/settings.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { InventoryItemProcessingService } from 'src/libs/shared/services/inventory-item-processing/inventory-item-processing.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { ItemActivationService } from 'src/libs/shared/services/item-activation/item-activation.service';
import { MessageProcessingService } from 'src/libs/shared/services/message-processing/message-processing.service';
import { BasicEquipmentService } from 'src/libs/shared/services/basic-equipment/basic-equipment.service';


@Injectable({
    providedIn: 'root',
})
export class CharacterService {
    private _character: Character = new Character();
    private _loading = false;

    constructor(
        private readonly _configService: ConfigService,
        private readonly _extensionsService: ExtensionsService,
        private readonly _savegamesService: SavegamesService,
        private readonly _abilitiesDataService: AbilitiesDataService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _classesDataService: ClassesDataService,
        private readonly _featsDataService: FeatsDataService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _effectsService: CreatureEffectsService,
        private readonly _deitiesDataService: DeitiesDataService,
        private readonly _animalCompanionsDataService: AnimalCompanionsDataService,
        private readonly _animalCompanionLevelsService: AnimalCompanionLevelsService,
        private readonly _familiarsDataService: FamiliarsDataService,
        private readonly _messagesService: MessagesService,
        private readonly _toastService: ToastService,
        private readonly _evaluationService: EvaluationService,
        private readonly _refreshService: RefreshService,
        popoverConfig: NgbPopoverConfig,
        tooltipConfig: NgbTooltipConfig,
        private readonly _activitiesProcessingService: ActivitiesProcessingService,
        private readonly _armorClassService: ArmorClassService,
        private readonly _healthService: HealthService,
        private readonly _armorPropertiesService: ArmorPropertiesService,
        private readonly _activityGainPropertyService: ActivityGainPropertiesService,
        private readonly _featTakingService: FeatTakingService,
        private readonly _characterLoreService: CharacterLoreService,
        private readonly _itemGrantingService: ItemGrantingService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _objectEffectsGenerationService: ObjectEffectsGenerationService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        private readonly _statusService: StatusService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _creatureFeatsService: CreatureFeatsService,
        private readonly _itemInitializationService: ItemInitializationService,
        private readonly _itemSpecializationsDataService: ItemSpecializationsDataService,
        private readonly _itemTransferService: ItemTransferService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,
        private readonly _itemActivationProcessingService: ItemActivationProcessingService,
        private readonly _settingsService: SettingsService,
        private readonly _inventoryService: InventoryService,
        private readonly _inventoryItemProcessingService: InventoryItemProcessingService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _itemActivationService: ItemActivationService,
        private readonly _messageProcessingService: MessageProcessingService,
        private readonly _basicEquipmentService: BasicEquipmentService,
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
    }

    public get stillLoading(): boolean {
        return this._loading;
    }

    public get character(): Character {
        if (!this.stillLoading) {
            return this._character;
        } else { return new Character(); }
    }

    public get companion(): AnimalCompanion {
        return this.character.class?.animalCompanion || new AnimalCompanion();
    }

    public get familiar(): Familiar {
        return this.character.class?.familiar || new Familiar();
    }

    public creatureFromType(type: CreatureTypes): Character | AnimalCompanion | Familiar {
        switch (type) {
            case CreatureTypes.Character:
                return this.character;
            case CreatureTypes.AnimalCompanion:
                return this.companion;
            case CreatureTypes.Familiar:
                return this.familiar;
            default:
                return new Character();
        }
    }

    public initialize(): void {
        this._loading = true;
        this._statusService.setLoadingStatus('Loading extensions');

        const waitForFileServices = setInterval(() => {
            if (!this._extensionsService.stillLoading && !this._configService.stillLoading) {
                clearInterval(waitForFileServices);
                this._statusService.setLoadingStatus('Initializing content');
                this.loadNewCharacter(new Character());
            }
        }, Defaults.waitForServiceDelay);
    }

    public reset(): void {
        this._loading = true;
    }

    public loadNewCharacter(newCharacter: Character, loadAsGM?: boolean): void {
        this._character = newCharacter;
        this._character.GMMode = loadAsGM;

        this._basicEquipmentService.equipBasicItems(this._character, false);

        this._loading = false;
    }

    public cancelLoadingNewCharacter(): void {
        this._loading = false;
    }

}
