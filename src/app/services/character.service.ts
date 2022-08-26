import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { SkillsDataService } from 'src/app/core/services/data/skills-data.service';
import { Armor } from 'src/app/classes/Armor';
import { Weapon } from 'src/app/classes/Weapon';
import { FeatsDataService } from 'src/app/core/services/data/feats-data.service';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { Activity } from 'src/app/classes/Activity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { Equipment } from 'src/app/classes/Equipment';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { DeitiesDataService } from 'src/app/core/services/data/deities-data.service';
import { AnimalCompanionsDataService } from 'src/app/core/services/data/animal-companions-data.service';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { SavegamesService } from 'src/libs/shared/saving-loading/services/savegames/savegames.service';
import { FamiliarsDataService } from 'src/app/core/services/data/familiars-data.service';
import { WornItem } from 'src/app/classes/WornItem';
import { ArmorRune } from 'src/app/classes/ArmorRune';
import { Shield } from 'src/app/classes/Shield';
import { Creature } from 'src/app/classes/Creature';
import { ConfigService } from 'src/app/core/services/config/config.service';
import { MessagesService } from 'src/libs/shared/services/messages/messages.service';
import { ToastService } from 'src/libs/shared/services/toast/toast.service';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { NgbPopoverConfig, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { ConditionSet } from 'src/app/classes/ConditionSet';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { EvaluationService } from 'src/libs/shared/services/evaluation/evaluation.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { ActivitiesProcessingService } from 'src/libs/shared/services/activities-processing/activities-processing.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { Specialization } from '../classes/Specialization';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { HintShowingItem } from 'src/libs/shared/definitions/Types/hintShowingItem';
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


@Injectable({
    providedIn: 'root',
})
export class CharacterService {
    private _character: Character = new Character();
    private _loading = false;
    private _basicItems: { weapon: Weapon; armor: Armor } = { weapon: null, armor: null };

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

    public characterFeatsShowingHintsOnThis(objectName = 'all'): Array<Feat> {
        return this._characterFeatsService.characterFeatsAndFeatures().filter(feat =>
            feat.hints.find(hint =>
                (hint.minLevel ? this.character.level >= hint.minLevel : true) &&
                hint.showon?.split(',').find(showon =>
                    objectName.toLowerCase() === 'all' ||
                    showon.trim().toLowerCase() === objectName.toLowerCase() ||
                    (
                        (
                            objectName.toLowerCase().includes('lore:') ||
                            objectName.toLowerCase().includes(' lore')
                        ) &&
                        showon.trim().toLowerCase() === 'lore'
                    ),
                ),
            ) && this._characterFeatsService.characterHasFeat(feat.name),
        );
    }

    public companionElementsShowingHintsOnThis(objectName = 'all'): Array<AnimalCompanionAncestry | AnimalCompanionSpecialization | Feat> {
        //Get showon elements from Companion Ancestry and Specialization
        return []
            .concat(
                [this.companion.class.ancestry]
                    .filter(ancestry =>
                        ancestry.hints
                            .find(hint =>
                                (hint.minLevel ? this.character.level >= hint.minLevel : true) &&
                                hint.showon?.split(',')
                                    .find(showon =>
                                        objectName === 'all' ||
                                        showon.trim().toLowerCase() === objectName.toLowerCase(),
                                    ),
                            ),
                    ),
            )
            .concat(
                this.companion.class.specializations
                    .filter(spec =>
                        spec.hints
                            .find(hint =>
                                (hint.minLevel ? this.character.level >= hint.minLevel : true) &&
                                hint.showon?.split(',')
                                    .find(showon =>
                                        objectName === 'all' ||
                                        showon.trim().toLowerCase() === objectName.toLowerCase(),
                                    ),
                            ),
                    ),
            )
            //Return any feats that include e.g. Companion:Athletics
            .concat(
                this.characterFeatsShowingHintsOnThis(`Companion:${ objectName }`),
            );
    }

    public familiarElementsShowingHintsOnThis(objectName = 'all'): Array<Feat> {
        //Get showon elements from Familiar Abilities
        return this._familiarsDataService.familiarAbilities().filter(feat =>
            feat.hints.find(hint =>
                (hint.minLevel ? this.character.level >= hint.minLevel : true) &&
                hint.showon?.split(',').find(showon =>
                    objectName.toLowerCase() === 'all' ||
                    showon.trim().toLowerCase() === objectName.toLowerCase() ||
                    (
                        (
                            objectName.toLowerCase().includes('lore:') ||
                            objectName.toLowerCase().includes(' lore')
                        ) &&
                        showon.trim().toLowerCase() === 'lore'
                    ),
                ),
            ) && this._creatureFeatsService.creatureHasFeat(feat, { creature: this.familiar }),
            //Return any feats that include e.g. Companion:Athletics
        )
            .concat(this.characterFeatsShowingHintsOnThis(`Familiar:${ objectName }`));
    }

    public creatureConditionsShowingHintsOnThis(creature: Creature, objectName = 'all'): Array<ConditionSet> {
        return this._creatureConditionsService.currentCreatureConditions(creature)
            .filter(conditionGain => conditionGain.apply)
            .map(conditionGain =>
                Object.assign(
                    new ConditionSet(),
                    { gain: conditionGain, condition: this._conditionsDataService.conditionFromName(conditionGain.name) },
                ),
            )
            .filter(conditionSet =>
                conditionSet.condition?.hints.find(hint =>
                    (hint.minLevel ? this.character.level >= hint.minLevel : true) &&
                    hint.showon?.split(',').find(showon =>
                        objectName.trim().toLowerCase() === 'all' ||
                        showon.trim().toLowerCase() === objectName.toLowerCase() ||
                        (
                            (
                                objectName.toLowerCase().includes('lore:') ||
                                objectName.toLowerCase().includes(' lore')
                            ) &&
                            showon.trim().toLowerCase() === 'lore'
                        ),
                    ),
                ),
            );
    }

    public creatureActivitiesShowingHintsOnThis(creature: Creature, objectName = 'all'): Array<Activity> {
        return this._creatureActivitiesService.creatureOwnedActivities(creature)
            //Conflate ActivityGains and their respective Activities into one object...
            .map(gain => ({ gain, activity: this._activityGainPropertyService.originalActivity(gain) }))
            //...so that we can find the activities where the gain is active or the activity doesn't need to be toggled...
            .filter((gainAndActivity: { gain: ActivityGain | ItemActivity; activity: Activity }) =>
                gainAndActivity.activity &&
                (
                    gainAndActivity.gain.active || !gainAndActivity.activity.toggle
                ),
            )
            //...and then keep only the activities.
            .map((gainAndActivity: { gain: ActivityGain | ItemActivity; activity: Activity }) => gainAndActivity.activity)
            .filter(activity =>
                activity?.hints.find(hint =>
                    hint.showon?.split(',').find(showon =>
                        objectName.trim().toLowerCase() === 'all' ||
                        showon.trim().toLowerCase() === objectName.toLowerCase() ||
                        (
                            (
                                objectName.toLowerCase().includes('lore:') ||
                                objectName.toLowerCase().includes(' lore')
                            ) &&
                            showon.trim().toLowerCase() === 'lore'
                        ),
                    ),
                ),
            );
    }

    public creatureItemsShowingHintsOnThis(creature: Creature, objectName = 'all'): Array<HintShowingItem> {
        const returnedItems: Array<HintShowingItem> = [];

        //Prepare function to add items whose hints match the objectName.
        const addItemIfHintsMatch = (item: HintShowingItem, allowResonant: boolean): void => {
            if (item.hints
                .some(hint =>
                    (allowResonant || !hint.resonant) &&
                    hint.showon?.split(',').find(showon =>
                        objectName.trim().toLowerCase() === 'all' ||
                        showon.trim().toLowerCase() === objectName.toLowerCase() ||
                        (
                            objectName.toLowerCase().includes('lore') &&
                            showon.trim().toLowerCase() === 'lore'
                        ) ||
                        (
                            //Show Emblazon Energy or Emblazon Antimagic Shield Block hint on Shield Block if the shield's blessing applies.
                            item instanceof Shield && item.emblazonArmament.length &&
                            (
                                (
                                    item.$emblazonEnergy &&
                                    objectName === 'Shield Block' &&
                                    showon === 'Emblazon Energy Shield Block'
                                ) || (
                                    item.$emblazonAntimagic &&
                                    objectName === 'Shield Block' &&
                                    showon === 'Emblazon Antimagic Shield Block'
                                )
                            )
                        ),
                    ),
                )
            ) {
                returnedItems.push(item);
            }
        };

        const hasTooManySlottedAeonStones = this._creatureEquipmentService.hasTooManySlottedAeonStones(creature);

        creature.inventories.forEach(inventory => {
            inventory.allEquipment()
                .filter(item =>
                    (item.equippable ? item.equipped : true) &&
                    item.amount &&
                    !item.broken &&
                    (item.canInvest() ? item.invested : true),
                )
                .forEach(item => {
                    addItemIfHintsMatch(item, false);
                    item.oilsApplied.forEach(oil => {
                        addItemIfHintsMatch(oil, false);
                    });

                    if (!hasTooManySlottedAeonStones && item instanceof WornItem) {
                        item.aeonStones.forEach(stone => {
                            addItemIfHintsMatch(stone, true);
                        });
                    }

                    if ((item instanceof Weapon || (item instanceof WornItem && item.isHandwrapsOfMightyBlows)) && item.propertyRunes) {
                        item.propertyRunes.forEach(rune => {
                            addItemIfHintsMatch(rune as WeaponRune, false);
                        });
                    }

                    if (item instanceof Armor && item.propertyRunes) {
                        (item as Equipment).propertyRunes.forEach(rune => {
                            addItemIfHintsMatch(rune as ArmorRune, false);
                        });
                    }

                    if (item instanceof Equipment && item.moddable && item.material) {
                        item.material.forEach(material => {
                            addItemIfHintsMatch(material, false);
                        });
                    }
                });
        });

        return returnedItems;
    }

    public creatureArmorSpecializationsShowingHintsOnThis(creature: Creature, objectName = 'all'): Array<Specialization> {
        if (creature.isCharacter()) {
            const equippedArmor = creature.inventories[0].armors.find(armor => armor.equipped);

            return equippedArmor
                ? this._armorPropertiesService
                    .armorSpecializations(equippedArmor, creature)
                    .filter(spec =>
                        spec?.hints
                            .find(hint =>
                                hint.showon.split(',')
                                    .find(showon =>
                                        objectName.trim().toLowerCase() === 'all' ||
                                        showon.trim().toLowerCase() === objectName.toLowerCase() ||
                                        (
                                            (
                                                objectName.toLowerCase().includes('lore:') ||
                                                objectName.toLowerCase().includes(' lore')
                                            ) &&
                                            showon.trim().toLowerCase() === 'lore'
                                        ),
                                    ),
                            ),
                    )
                : [];
        } else {
            return [];
        }
    }

    public maxFocusPoints(): number {
        let focusPoints = 0;

        this._effectsService.absoluteEffectsOnThis(this.character, 'Focus Pool').forEach(effect => {
            focusPoints = parseInt(effect.setValue, 10);
        });
        this._effectsService.relativeEffectsOnThis(this.character, 'Focus Pool').forEach(effect => {
            focusPoints += parseInt(effect.value, 10);
        });

        return Math.min(focusPoints, Defaults.maxFocusPoints);
    }

    public isMobileView(): boolean {
        return (window.innerWidth < Defaults.mobileBreakpointPx);
    }

    public initializeAnimalCompanion(): void {
        const character = this.character;

        if (character.class.animalCompanion) {
            character.class.animalCompanion =
                Object.assign(new AnimalCompanion(), character.class.animalCompanion).recast(this._itemsDataService);

            const companion = character.class.animalCompanion;

            companion.class.levels = this._animalCompanionsDataService.companionLevels();
            this.equipBasicItems(companion);
            this._animalCompanionLevelsService.setLevel(companion);
        }
    }

    public initializeFamiliar(): void {
        const character = this.character;

        if (character.class.familiar) {
            character.class.familiar = Object.assign(new Familiar(), character.class.familiar).recast(this._itemsDataService);
            this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'all');
        }
    }

    public removeAllFamiliarAbilities(): void {
        const familiar = this.familiar;
        const abilityNames = familiar.abilities.feats.map(gain => gain.name);

        abilityNames.forEach(abilityName => {
            this._featTakingService.takeFeat(familiar, undefined, abilityName, false, familiar.abilities, undefined);
        });
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

        // When the character is loaded, do some things that require everything to be in working order:
        // Give the character a Fist and an Unarmored™ if they have nothing else,
        // and keep those ready if they should drop their last weapon or armor.
        this._grantBasicItems();

        this._loading = false;
    }

    public cancelLoadingNewCharacter(): void {
        this._loading = false;
    }

    public equipBasicItems(creature: Creature, changeAfter = true): void {
        if (!this.stillLoading && this._basicItems.weapon && this._basicItems.armor && !(creature.isFamiliar())) {
            const isInventoryTouchedBefore = creature.inventories[0].touched;

            if (!creature.inventories[0].weapons.some(weapon => !weapon.broken) && (creature.isCharacter())) {
                this._inventoryService.grantInventoryItem(
                    this._basicItems.weapon,
                    { creature, inventory: creature.inventories[0] },
                    { changeAfter: false, equipAfter: false },
                );
            }

            if (!creature.inventories[0].armors.some(armor => !armor.broken)) {
                this._inventoryService.grantInventoryItem(
                    this._basicItems.armor,
                    { creature, inventory: creature.inventories[0] },
                    { changeAfter: false, equipAfter: false },
                );
            }

            if (!creature.inventories[0].weapons.some(weapon => weapon.equipped === true)) {
                if (creature.inventories[0].weapons.some(weapon => !weapon.broken)) {
                    this._creatureEquipmentService.equipItem(
                        creature,
                        creature.inventories[0],
                        creature.inventories[0].weapons.find(weapon => !weapon.broken),
                        true,
                        changeAfter,
                    );
                }
            }

            if (!creature.inventories[0].armors.some(armor => armor.equipped === true)) {
                if (creature.inventories[0].weapons.some(armor => !armor.broken)) {
                    this._creatureEquipmentService.equipItem(
                        creature,
                        creature.inventories[0],
                        creature.inventories[0].armors.find(armor => !armor.broken),
                        true,
                        changeAfter,
                    );
                }
            }

            creature.inventories[0].touched = isInventoryTouchedBefore;
        }
    }

    private _grantBasicItems(): void {
        //This function depends on the items being loaded, and it will wait forever for them!
        const grantBasicItems = (): void => {
            const newBasicWeapon: Weapon =
                Object.assign(
                    new Weapon(),
                    this._itemsDataService.cleanItemFromID('08693211-8daa-11ea-abca-ffb46fbada73'),
                ).recast(this._itemsDataService);
            const newBasicArmor: Armor =
                Object.assign(
                    new Armor(),
                    this._itemsDataService.cleanItemFromID('89c1a2c2-8e09-11ea-9fab-e92c63c14723'),
                ).recast(this._itemsDataService);

            this._basicItems = { weapon: newBasicWeapon, armor: newBasicArmor };
            this.equipBasicItems(this.character, false);
            this.equipBasicItems(this.companion, false);
        };

        if (!this._itemsDataService.stillLoading) {
            grantBasicItems();
        } else {
            const waitForItemsService = setInterval(() => {
                if (!this._itemsDataService.stillLoading) {
                    clearInterval(waitForItemsService);
                    grantBasicItems();
                }
            }, Defaults.waitForServiceDelay);
        }


    }

}
