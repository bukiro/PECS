/* eslint-disable complexity */
/* eslint-disable max-lines */
import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { Skill } from 'src/app/classes/Skill';
import { switchMap, tap } from 'rxjs';
import { Item } from 'src/app/classes/Item';
import { Class } from 'src/app/classes/Class';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { SkillsDataService } from 'src/app/core/services/data/skills-data.service';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Armor } from 'src/app/classes/Armor';
import { Weapon } from 'src/app/classes/Weapon';
import { FeatsDataService } from 'src/app/core/services/data/feats-data.service';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { Activity } from 'src/app/classes/Activity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { Consumable } from 'src/app/classes/Consumable';
import { Equipment } from 'src/app/classes/Equipment';
import { EffectGain } from 'src/app/classes/EffectGain';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { Rune } from 'src/app/classes/Rune';
import { DeitiesDataService } from 'src/app/core/services/data/deities-data.service';
import { Deity } from 'src/app/classes/Deity';
import { AnimalCompanionsDataService } from 'src/app/core/services/data/animal-companions-data.service';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { SavegamesService } from 'src/libs/shared/saving-loading/services/savegames/savegames.service';
import { FamiliarsDataService } from 'src/app/core/services/data/familiars-data.service';
import { Oil } from 'src/app/classes/Oil';
import { WornItem } from 'src/app/classes/WornItem';
import { ArmorRune } from 'src/app/classes/ArmorRune';
import { Ammunition } from 'src/app/classes/Ammunition';
import { Shield } from 'src/app/classes/Shield';
import { AlchemicalBomb } from 'src/app/classes/AlchemicalBomb';
import { Snare } from 'src/app/classes/Snare';
import { OtherConsumableBomb } from 'src/app/classes/OtherConsumableBomb';
import { Creature } from 'src/app/classes/Creature';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { ConfigService } from 'src/app/core/services/config/config.service';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { PlayerMessage } from 'src/app/classes/PlayerMessage';
import { MessagesService } from 'src/libs/shared/services/messages/messages.service';
import { ToastService } from 'src/libs/shared/services/toast/toast.service';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { NgbPopoverConfig, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { ConditionSet } from 'src/app/classes/ConditionSet';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { FeatTaken } from 'src/app/character-creation/definitions/models/FeatTaken';
import { EvaluationService } from 'src/libs/shared/services/evaluation/evaluation.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { ActivitiesProcessingService } from 'src/libs/shared/services/activities-processing/activities-processing.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { Speed } from '../classes/Speed';
import { AbilityModFromAbilityValue } from 'src/libs/shared/util/abilityUtils';
import { Specialization } from '../classes/Specialization';
import { CutOffDecimals } from 'src/libs/shared/util/numberUtils';
import { CopperAmounts, CurrencyIndices } from 'src/libs/shared/definitions/currency';
import { HttpStatusCode } from '@angular/common/http';
import { Ability } from '../classes/Ability';
import { Health } from '../classes/Health';
import { AnimalCompanionLevel } from '../classes/AnimalCompanionLevel';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { HintShowingItem } from 'src/libs/shared/definitions/Types/hintShowingItem';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { ArmorClassService, CoverTypes } from 'src/libs/defense/services/armor-class/armor-class.service';
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
import { TypeService } from 'src/libs/shared/services/type/type.service';
import { ItemTransferService } from 'src/libs/shared/services/item-transfer/item-transfer.service';
import { CreatureEquipmentService } from 'src/libs/shared/services/creature-equipment/creature-equipment.service';
import { ItemProcessingService } from 'src/libs/shared/services/item-processing/item-processing.service';

interface PreparedOnceEffect {
    creatureType: CreatureTypes;
    effectGain: EffectGain;
    conditionValue: number;
    conditionHeightened: number;
    conditionChoice: string;
    conditionSpellCastingAbility: string;
}

interface EffectRecipientPhrases {
    name: string;
    pronounCap: string;
    pronoun: string;
    pronounGenitive: string;
    verbIs: string;
    verbHas: string;
}

@Injectable({
    providedIn: 'root',
})
export class CharacterService {
    private _character: Character = new Character();
    private _loading = false;
    private _basicItems: { weapon: Weapon; armor: Armor } = { weapon: null, armor: null };
    private _preparedOnceEffects: Array<PreparedOnceEffect> = [];

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
        private readonly _itemProcessingService: ItemProcessingService,
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

    public get isDarkmode(): boolean {
        if (!this.stillLoading) {
            return this.character.settings.darkmode;
        } else { return true; }
    }

    public get isGMMode(): boolean {
        return this.character.GMMode;
    }

    public get isManualMode(): boolean {
        return this.character.settings.manualMode;
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

    public isBlankCharacter(): boolean {
        // The character is blank if textboxes haven't been used, no class and no basevalues have been chosen,
        // and no items have been added other than the starter items.
        const character = this.character;
        const characterStartingInventoryAmount = 2;
        const characterStartingItemAmount = 2;

        return (
            !character.class?.name &&
            !character.name &&
            !character.partyName &&
            !character.experiencePoints &&
            character.alignment === 'Neutral' &&
            !character.baseValues.length &&
            character.inventories.length <= characterStartingInventoryAmount &&
            // The character is not blank if any inventory has more than 0 items (more than 2 for the first)
            // or if any item is not one of the basic items.
            !character.inventories.some((inv, index) =>
                inv.allItems().length > (index ? 0 : characterStartingItemAmount) ||
                inv.allItems().some(item =>
                    ![
                        this._basicItems.weapon?.id || 'noid',
                        this._basicItems.armor?.id || 'noid',
                    ].includes(item.refId),
                ))
        );
    }

    public isLoggedIn(): boolean {
        return this._configService.isLoggedIn;
    }

    public isCompanionAvailable(charLevel: number = this.character.level): boolean {
        //Return any feat that grants an animal companion that you own.
        return this.characterFeatsAndFeatures()
            .some(feat =>
                feat.gainAnimalCompanion === 'Young' &&
                this.characterHasFeat(feat.name, charLevel),
            );
    }

    public isFamiliarAvailable(charLevel: number = this.character.level): boolean {
        //Return any feat that grants an animal companion that you own.
        return this.characterFeatsAndFeatures()
            .some(feat =>
                feat.gainFamiliar &&
                this.characterHasFeat(feat.name, charLevel),
            );
    }

    public allAvailableCreatures(
        companionAvailable: boolean = this.isCompanionAvailable(),
        familiarAvailable: boolean = this.isFamiliarAvailable(),
    ): Array<Creature> {
        if (!this.stillLoading) {
            if (companionAvailable && familiarAvailable) {
                return ([] as Array<Creature>).concat(this.character).concat(this.companion)
                    .concat(this.familiar);
            } else if (companionAvailable) {
                return ([] as Array<Creature>).concat(this.character).concat(this.companion);
            } else if (familiarAvailable) {
                return ([] as Array<Creature>).concat(this.character).concat(this.familiar);
            } else {
                return ([] as Array<Creature>).concat(this.character);
            }
        } else { return [new Character()]; }
    }

    public characterClasses(name: string): Array<Class> {
        return this._classesDataService.classes(name);
    }

    public deities(name = ''): Array<Deity> {
        return this._deitiesDataService.deities(name);
    }

    public currentCharacterDeities(character: Character, source = '', level: number = character.level): Array<Deity> {
        return this._characterDeitiesService.currentCharacterDeities(character, source, level);
    }

    public creatureSpeeds(creature: Creature, name = ''): Array<Speed> {
        return creature.speeds.filter(speed => !name || speed.name === name);
    }

    public updateLanguageList(): void {
        // Ensure that the language list is always as long as ancestry languages + INT + any relevant feats and bonuses.
        // This function is called by the effects service after generating effects,
        // so that new languages aren't thrown out before the effects are generated.
        // Don't call this function in situations where effects are going to change,
        // but haven't been generated yet - or you may lose languages.
        const character = this.character;
        const noLevel = -1;
        const temporarySourceLevel = -2;

        if (character.class.name) {
            // Collect everything that gives you free languages, and the level on which it happens.
            // This will allow us to mark languages as available depending on their level.
            const languageSources: Array<{ name: string; level: number; amount: number }> = [];

            //Free languages from your ancestry
            const ancestryLanguages: number = character.class.ancestry.baseLanguages - character.class.ancestry.languages.length;

            if (ancestryLanguages) {
                languageSources.push({ name: 'Ancestry', level: 0, amount: ancestryLanguages });
            }

            //Free languages from your base intelligence
            const baseIntelligence: number = this._abilityValuesService.baseValue('Intelligence', character, 0)?.result;
            const baseInt: number = AbilityModFromAbilityValue(baseIntelligence);

            if (baseInt > 0) {
                languageSources.push({ name: 'Intelligence', level: 0, amount: baseInt });
            }

            //Build an array of int per level for comparison between the levels, starting with the base at 0.
            const int: Array<number> = [baseInt];

            character.class.levels.filter(level => level.number > 0).forEach(level => {
                //Collect all feats you have that grant extra free languages, then note on which level you have them.
                //Add the amount that they would grant you on that level by faking a level for the effect.
                this.characterFeatsTaken(level.number, level.number).forEach(taken => {
                    const feat = this.featsAndFeatures(taken.name)[0];

                    if (feat) {
                        if (feat.effects.some(effect => effect.affected === 'Max Languages')) {
                            const effects =
                                this._objectEffectsGenerationService.effectsFromEffectObject(
                                    feat,
                                    { creature: character },
                                    { name: taken.name, pretendCharacterLevel: level.number },
                                );

                            effects.filter(effect => effect.target === 'Max Languages').forEach(effect => {
                                languageSources.push({ name: taken.name, level: level.number, amount: parseInt(effect.value, 10) });
                            });
                        }
                    }
                });

                //Also add more languages if INT has been raised (and is positive).
                //Compare INT on this level with INT on the previous level. Don't do this on Level 0, obviously.
                const levelIntelligence: number = this._abilityValuesService.baseValue('Intelligence', character, level.number)?.result;

                int.push(AbilityModFromAbilityValue(levelIntelligence));

                const levelIntDiff = int[level.number] - int[level.number - 1];

                if (levelIntDiff > 0 && int[level.number] > 0) {
                    languageSources.push({ name: 'Intelligence', level: level.number, amount: Math.min(levelIntDiff, int[level.number]) });
                }
            });

            //Never apply absolute effects or negative effects to Max Languages. This should not happen in the game,
            // and it could delete your chosen languages.
            //Check if you have already collected this effect by finding a languageSource with the same source and amount.
            //Only if a source cannot be found, add the effect as a temporary source (level = -2).
            this._effectsService.relativeEffectsOnThis(this.character, 'Max Languages').forEach(effect => {
                if (parseInt(effect.value, 10) > 0) {
                    const matchingSource =
                        languageSources.find(source => source.name === effect.source && source.amount === parseInt(effect.value, 10));

                    if (!matchingSource) {
                        languageSources.push({ name: effect.source, level: temporarySourceLevel, amount: parseInt(effect.value, 10) });
                    }
                }
            });

            // If the current INT is positive and higher than the base INT for the current level
            // (e.g. because of an item bonus), add another temporary language source.
            const currentInt = this._abilityValuesService.mod('Intelligence', character)?.result;
            const diff = currentInt - int[character.level];

            if (diff > 0 && currentInt > 0) {
                languageSources.push({ name: 'Intelligence', level: temporarySourceLevel, amount: Math.min(diff, currentInt) });
            }

            //Remove all free languages that have not been filled.
            character.class.languages = character.class.languages.sort().filter(language => language.name || language.locked);

            // Make a new list of all the free languages.
            // We will pick and sort the free languages from here into the character language list.
            const tempLanguages: Array<LanguageGain> =
                character.class.languages
                    .filter(language => !language.locked)
                    .map(language => language.clone());

            //Reduce the character language list to only the locked ones.
            character.class.languages = character.class.languages.filter(language => language.locked);

            //Add free languages based on the sources and the copied language list:
            // - For each source, find a language that has the same source and the same level.
            // - If not available, find a language that has the same source and no level (level -1).
            // (This is mainly for the transition from the old language calculations. Languages should not have level -1 in the future.)
            // - If not available, add a new blank language.
            languageSources.forEach(languageSource => {
                for (let index = 0; index < languageSource.amount; index++) {
                    let existingLanguage =
                        tempLanguages.find(language =>
                            language.source === languageSource.name &&
                            language.level === languageSource.level &&
                            !language.locked,
                        );

                    if (existingLanguage) {
                        character.class.languages.push(existingLanguage);
                        tempLanguages.splice(tempLanguages.indexOf(existingLanguage), 1);
                    } else {
                        existingLanguage =
                            tempLanguages.find(language =>
                                language.source === languageSource.name &&
                                language.level === noLevel &&
                                !language.locked,
                            );

                        if (existingLanguage) {
                            const newLanguage = existingLanguage.clone();

                            newLanguage.level = languageSource.level;
                            character.class.languages.push(newLanguage);
                            tempLanguages.splice(tempLanguages.indexOf(existingLanguage), 1);
                        } else {
                            character.class.languages.push(
                                Object.assign(
                                    new LanguageGain(),
                                    { name: '', source: languageSource.name, locked: false, level: languageSource.level },
                                ) as LanguageGain,
                            );
                        }
                    }
                }
            });

            // If any languages are left in the temporary list, assign them to any blank languages,
            // preferring same source, Intelligence and then Multilingual as sources.
            tempLanguages.forEach(lostLanguage => {
                const targetLanguage =
                    character.class.languages
                        .find(freeLanguage =>
                            !freeLanguage.locked &&
                            !freeLanguage.name &&
                            freeLanguage.source === lostLanguage.source,
                        ) ||
                    character.class.languages
                        .find(freeLanguage =>
                            !freeLanguage.locked &&
                            !freeLanguage.name &&
                            freeLanguage.source === 'Intelligence',
                        ) ||
                    character.class.languages
                        .find(freeLanguage =>
                            !freeLanguage.locked &&
                            !freeLanguage.name &&
                            freeLanguage.source === 'Multilingual',
                        ) ||
                    character.class.languages
                        .find(freeLanguage =>
                            !freeLanguage.locked &&
                            !freeLanguage.name,
                        );

                if (targetLanguage) {
                    targetLanguage.name = lostLanguage.name;
                }
            });

            //Sort languages by locked > level > source > name.
            character.class.languages = character.class.languages
                .sort((a, b) => {
                    if (a.name && !b.name) {
                        return -1;
                    }

                    if (!a.name && b.name) {
                        return 1;
                    }

                    if (a.name > b.name) {
                        return 1;
                    }

                    if (a.name < b.name) {
                        return -1;
                    }

                    return 0;
                })
                .sort((a, b) => (a.level + a.source === b.level + b.source) ? 0 : ((a.level + a.source > b.level + b.source) ? 1 : -1))
                .sort((a, b) => {
                    if (!a.locked && b.locked) {
                        return 1;
                    }

                    if (a.locked && !b.locked) {
                        return -1;
                    }

                    return 0;
                });
        }
    }

    public changeDeity(deity: Deity): void {
        const character = this.character;

        character.class.deity = deity.name;
        this._characterDeitiesService.clearCharacterDeities();
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells', 'clear');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
    }

    public cleanItems(): ItemCollection {
        return this._itemsDataService.cleanItems();
    }

    public itemGroupSpecializations(group = ''): Array<Specialization> {
        return this._itemSpecializationsDataService.specializations(group);
    }

    public creatureInvestedItems(creature: Creature): Array<Equipment> {
        return creature.inventories[0]?.allEquipment().filter(item => item.invested && item.traits.includes('Invested')) || [];
    }

    public grantInventoryItem(
        item: Item,
        context: { creature: Creature; inventory: ItemCollection; amount?: number },
        options: {
            resetRunes?: boolean;
            changeAfter?: boolean;
            equipAfter?: boolean;
            newId?: boolean;
            expiration?: number;
            newPropertyRunes?: Array<Partial<Rune>>;
        } = {},
    ): Item {
        context = {
            amount: 1,
            ...context,
        };
        options = {
            resetRunes: true,
            changeAfter: true,
            equipAfter: true,
            newId: true,
            expiration: 0,
            newPropertyRunes: [],
            ...options,
        };
        this._refreshService.prepareDetailToChange(context.creature.type, 'inventory');
        this._refreshService.prepareDetailToChange(context.creature.type, 'effects');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');

        const newInventoryItem =
            this._itemInitializationService.initializeItem(item, { newId: options.newId, newPropertyRunes: options.newPropertyRunes });
        let returnedItem: Item;
        // Check if this item already exists in the inventory, and if it is stackable and doesn't expire.
        // Don't make that check if this item expires.
        let existingItems: Array<Item> = [];

        if (!options.expiration && newInventoryItem.canStack()) {
            existingItems = context.inventory[item.type].filter((existing: Item) =>
                existing.name === newInventoryItem.name && newInventoryItem.canStack() && !item.expiration,
            );
        }

        // If any existing, stackable items are found, try parsing the amount (set it to 1 if failed),
        // then raise the amount on the first of the existing items.
        // The amount must be parsed because it could be set to anything during custom item creation.
        // If no items are found, add the new item to the inventory.
        // Set returnedInventoryItem to either the found or the new item for further processing.
        if (existingItems.length) {
            let intAmount = 1;

            try {
                intAmount = parseInt(context.amount.toString(), 10);
            } catch (error) {
                intAmount = 1;
            }

            existingItems[0].amount += intAmount;
            returnedItem = existingItems[0];
            //Update gridicons of the expanded item.
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, returnedItem.id);
        } else {
            const newInventoryLength = context.inventory[newInventoryItem.type].push(newInventoryItem);

            returnedItem = context.inventory[newInventoryItem.type][newInventoryLength - 1];

            if (context.amount > 1) {
                returnedItem.amount = context.amount;
            }

            if (options.expiration) {
                returnedItem.expiration = options.expiration;
            }

            this.processGrantedItem(context.creature, returnedItem, context.inventory, options.equipAfter, options.resetRunes);
        }

        if (options.changeAfter) {
            this._refreshService.processPreparedChanges();
        }

        return returnedItem;
    }

    public processGrantedItem(
        creature: Creature,
        item: Item,
        inventory: ItemCollection,
        equip = true,
        resetRunes = true,
        skipGrantedItems = false,
        skipGainedInventories = false,
    ): void {
        this._refreshService.prepareDetailToChange(creature.type, 'inventory');

        //Disable activities on equipment and runes. Refresh all affected components.
        if (((item instanceof Equipment) || (item instanceof Rune)) && item.activities?.length) {
            item.activities.forEach(activity => {
                activity.active = false;
                this._refreshService.prepareChangesByHints(creature, activity.hints);
            });
            this._refreshService.prepareDetailToChange(creature.type, 'activities');
        }

        if ((item instanceof Equipment) || (item instanceof Rune) || (item instanceof Oil)) {
            this._refreshService.prepareChangesByHints(creature, item.hints);
        }

        if (item instanceof Equipment) {
            if (item.gainActivities?.length) {
                item.gainActivities.forEach(gain => {
                    gain.active = false;
                });
                this._refreshService.prepareDetailToChange(creature.type, 'activities');
            }

            if (equip && Object.prototype.hasOwnProperty.call(item, 'equipped') && item.equippable) {
                this.equipItem(creature, inventory, item, true, false);
            }

            if (item instanceof Weapon) {
                const customFeats = this._featsDataService.createWeaponFeats([item]);

                customFeats.forEach(customFeat => {
                    const oldFeat = this.character.customFeats.find(existingFeat => existingFeat.name === customFeat.name);

                    if (oldFeat) {
                        this.character.removeCustomFeat(oldFeat);
                    }

                    this.character.addCustomFeat(customFeat);

                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
                });
            }

            if (resetRunes && item.moddable) {
                item.potencyRune = item.strikingRune = item.resilientRune = item.propertyRunes.length = 0;
            }

            item.propertyRunes.filter(rune => rune.loreChoices?.length).forEach(rune => {
                this.addRuneLore(rune);
            });

            if (!skipGainedInventories) {
                //Add all Inventories that you get from this item.
                if (item.gainInventory) {
                    item.gainInventory.forEach(gain => {
                        const newLength = creature.inventories.push(new ItemCollection());
                        const newInventory = creature.inventories[newLength - 1];

                        newInventory.itemId = item.id;
                        newInventory.bulkLimit = gain.bulkLimit;
                        newInventory.bulkReduction = gain.bulkReduction;
                    });
                }
            }

            if (!skipGrantedItems) {
                //Add all Items that you get from being granted this one
                if (item.gainItems.length) {
                    item.gainItems.filter(gainItem => gainItem.on === 'grant' && gainItem.amount > 0).forEach(gainItem => {
                        this._itemGrantingService.grantGrantedItem(
                            gainItem,
                            creature,
                            { sourceName: item.effectiveName(), grantingItem: item },
                        );
                    });
                }
            }
        }

        if (item instanceof AlchemicalBomb || item instanceof OtherConsumableBomb || item instanceof Ammunition || item instanceof Snare) {
            this._refreshService.prepareDetailToChange(creature.type, 'attacks');
        }
    }

    public dropInventoryItem(
        creature: Creature,
        inventory: ItemCollection,
        item: Item,
        changeAfter = true,
        equipBasicItems = true,
        including = true,
        amount = 1,
        keepInventoryContent = false,
    ): void {
        //Don't handle items that are already being dropped.
        if (item.markedForDeletion) {
            return;
        }

        item.markedForDeletion = true;
        this._refreshService.prepareDetailToChange(creature.type, 'inventory');
        this._refreshService.prepareDetailToChange(creature.type, 'effects');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
        this._refreshService.prepareChangesByItem(creature, item);

        if (amount < item.amount) {
            item.amount -= amount;
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, item.id);
        } else {
            if ((item instanceof Equipment) || (item instanceof Rune) || (item instanceof Oil)) {
                this._refreshService.prepareChangesByHints(creature, item.hints);
            }

            if ((item instanceof Equipment) || (item instanceof Rune)) {
                item.activities.forEach(activity => {
                    if (activity.active) {
                        this._activitiesProcessingService.activateActivity(
                            activity,
                            false,
                            {
                                creature,
                                gain: activity,
                            },
                        );
                    }
                });
            }

            if (item instanceof Equipment) {
                if (item.equipped) {
                    this.equipItem(creature, inventory, item as Equipment, false, false);
                } else if (item.invested && item.canInvest()) {
                    this.investItem(creature, inventory, item as Equipment, false, false);
                } else if (!item.equippable && !item.canInvest()) {
                    this._creatureConditionsService.removeGainedItemConditions(creature, item);
                }

                if (item.propertyRunes) {
                    item.propertyRunes.filter((rune: Rune) => rune.loreChoices.length).forEach((rune: Rune) => {
                        this.removeRuneLore(rune);
                    });
                }

                if (item.gainActivities) {
                    item.gainActivities.forEach(gain => {
                        if (gain.active) {
                            this._activitiesProcessingService.activateActivity(
                                this._activitiesDataService.activities(gain.name)[0],
                                false,
                                {
                                    creature,
                                    gain,
                                },
                            );
                        }
                    });
                }

                if (item.gainInventory?.length) {
                    if (keepInventoryContent) {
                        this._preserveInventoryContentBeforeDropping(creature, item);
                    } else {
                        creature.inventories.filter(existingInventory => existingInventory.itemId === item.id).forEach(gainedInventory => {
                            gainedInventory.allItems().forEach(inventoryItem => {
                                this.dropInventoryItem(creature, gainedInventory, inventoryItem, false, false, including);
                            });
                        });
                    }

                    creature.inventories = creature.inventories.filter(existingInventory => existingInventory.itemId !== item.id);
                }

                if (including) {
                    item.gainItems.filter(gainItem => gainItem.on === 'grant').forEach(gainItem => {
                        this._itemGrantingService.dropGrantedItem(gainItem, creature);
                    });
                }
            }

            item.oilsApplied.filter((oil: Oil) => oil.runeEffect.loreChoices.length).forEach((oil: Oil) => {
                this.removeRuneLore(oil.runeEffect);
            });

            if (item instanceof Weapon) {
                this._markUnneededWeaponFeatsForDeletion(item);
            }

            //The item is deleted here.
            inventory[item.type] = inventory[item.type].filter((inventoryItem: Item) => inventoryItem !== item);

            if (equipBasicItems) {
                this._equipBasicItems(creature);
            }
        }

        //If the item still exists at this point, unmark it for deletion, so it doesn't become un-droppable.
        item.markedForDeletion = false;

        if (item instanceof AlchemicalBomb || item instanceof OtherConsumableBomb || item instanceof Ammunition || item instanceof Snare) {
            this._refreshService.prepareDetailToChange(creature.type, 'attacks');
        }

        if (changeAfter) {
            this._refreshService.processPreparedChanges();
        }

        this._refreshService.setComponentChanged(item.id);
    }

    public addRuneLore(rune: Rune): void {
        //Go through all the loreChoices (usually only one)
        rune.loreChoices.forEach(choice => {
            // Check if only one (=this) item's rune has this lore
            // (and therefore no other item has already created it on the character), and if so, create it.
            if (
                this.character.inventories[0]?.allEquipment()
                    .filter(item => item.propertyRunes
                        .some(propertyRune => propertyRune.loreChoices
                            .some(otherchoice => otherchoice.loreName === choice.loreName),
                        ),
                    ).length +
                this.character.inventories[0]?.allEquipment()
                    .filter(item => item.oilsApplied
                        .some(oil => oil.runeEffect && oil.runeEffect.loreChoices
                            .some(otherchoice => otherchoice.loreName === choice.loreName),
                        ),
                    ).length === 1) {
                this._characterLoreService.addLore(this.character, choice);
            }
        });
    }

    public removeRuneLore(rune: Rune): void {
        //Iterate through the loreChoices (usually only one)
        rune.loreChoices.forEach(choice => {
            //Check if only one item's rune has this lore (and therefore no other rune still needs it created), and if so, remove it.
            if (this.character.inventories[0]?.allEquipment()
                .filter(item => item.propertyRunes
                    .filter(propertyRune => propertyRune.loreChoices
                        .filter(otherchoice => otherchoice.loreName === choice.loreName)
                        .length)
                    .length)
                .length +
                this.character.inventories[0]?.allEquipment()
                    .filter(item => item.oilsApplied
                        .filter(oil => oil.runeEffect && oil.runeEffect.loreChoices
                            .filter(otherchoice => otherchoice.loreName === choice.loreName)
                            .length)
                        .length)
                    .length === 1) {
                this._characterLoreService.removeLore(this.character, choice);
            }
        });
    }

    public addCash(
        multiplier = 1,
        sum: number,
        amounts: { platinum?: number; gold?: number; silver?: number; copper?: number } = {},
    ): void {
        amounts = {
            platinum: 0,
            gold: 0,
            silver: 0,
            copper: 0,
            ...amounts,
        };

        const platIn100Plat = 100;
        const decimal = 10;

        if (sum) {
            //Resolve a sum (in copper) into platinum, gold, silver and copper.
            // Gold is prioritised - only gold amounts over 1000 are exchanged for platinum.
            amounts.platinum = amounts.gold = amounts.silver = amounts.copper = 0;
            amounts.platinum = Math.floor(sum / CopperAmounts.CopperIn100Platinum) * platIn100Plat;
            sum %= CopperAmounts.CopperIn100Platinum;
            amounts.gold = Math.floor(sum / CopperAmounts.CopperInGold);
            sum %= CopperAmounts.CopperInGold;
            amounts.silver = Math.floor(sum / CopperAmounts.CopperInSilver);
            sum %= CopperAmounts.CopperInSilver;
            amounts.copper = sum;
        }

        if (amounts.copper) {
            this.character.cash[CurrencyIndices.Copper] += (amounts.copper * multiplier);

            if (
                this.character.cash[CurrencyIndices.Copper] < 0 &&
                (
                    this.character.cash[CurrencyIndices.Silver] > 0 ||
                    this.character.cash[CurrencyIndices.Gold] > 0 ||
                    this.character.cash[CurrencyIndices.Platinum] > 0
                )
            ) {
                amounts.silver += Math.floor(this.character.cash[CurrencyIndices.Copper] / decimal) * multiplier;
                this.character.cash[CurrencyIndices.Copper] -= CutOffDecimals(this.character.cash[CurrencyIndices.Copper], 1);
            }

        }

        if (amounts.silver) {
            this.character.cash[CurrencyIndices.Silver] += (amounts.silver * multiplier);

            if (
                this.character.cash[CurrencyIndices.Silver] < 0 &&
                (
                    this.character.cash[CurrencyIndices.Gold] > 0 ||
                    this.character.cash[CurrencyIndices.Platinum] > 0
                )
            ) {
                amounts.gold += Math.floor(this.character.cash[CurrencyIndices.Silver] / decimal) * multiplier;
                this.character.cash[CurrencyIndices.Silver] -= CutOffDecimals(this.character.cash[CurrencyIndices.Silver], 1);
            }
        }

        if (amounts.gold) {
            this.character.cash[1] += (amounts.gold * multiplier);

            if (
                this.character.cash[CurrencyIndices.Gold] < 0 &&
                this.character.cash[CurrencyIndices.Platinum] > 0
            ) {
                amounts.platinum += Math.floor(this.character.cash[CurrencyIndices.Gold] / decimal) * multiplier;
                this.character.cash[CurrencyIndices.Gold] -= CutOffDecimals(this.character.cash[CurrencyIndices.Gold], 1);
            }
        }

        if (amounts.platinum) {
            this.character.cash[CurrencyIndices.Platinum] += (amounts.platinum * multiplier);

            if (this.character.cash[CurrencyIndices.Platinum] < 0) {
                this.sortCash();
            }
        }

        if (
            this.character.cash[CurrencyIndices.Platinum] < 0 ||
            this.character.cash[CurrencyIndices.Gold] < 0 ||
            this.character.cash[CurrencyIndices.Silver] < 0
        ) {
            this.sortCash();
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
    }

    public sortCash(): void {
        const sum =
            (this.character.cash[CurrencyIndices.Platinum] * CopperAmounts.CopperInPlatinum)
            + (this.character.cash[CurrencyIndices.Gold] * CopperAmounts.CopperInGold)
            + (this.character.cash[CurrencyIndices.Silver] * CopperAmounts.CopperInSilver)
            + (this.character.cash[CurrencyIndices.Copper]);

        this.character.cash = [0, 0, 0, 0];
        this.addCash(1, sum);
    }

    public equipItem(
        creature: Creature,
        inventory: ItemCollection,
        item: Equipment,
        equip = true,
        changeAfter = true,
        equipBasicItems = true,
    ): void {
        // Only allow equipping or unequipping for items that the creature can wear.
        // Only allow equipping items in inventories that aren't containers (i.e. the first two).
        // Unequip any item that lands here and can't be equipped.
        const isEquippedAtBeginning = item.equipped;

        const canEquip = (): boolean => (
            !inventory.itemId &&
            (
                item.name === 'Unarmored' ||
                ((creature.isCharacter()) !== item.traits.includes('Companion'))
            ) && (
                !(creature.isFamiliar()) ||
                !(item instanceof Armor || item instanceof Weapon || item instanceof Shield)
            )
        );

        if (canEquip()) {
            item.equipped = equip;
        } else {
            item.equipped = false;
        }

        this._refreshService.prepareDetailToChange(creature.type, 'inventory');
        this._refreshService.prepareChangesByItem(
            creature,
            item,
        );

        if (!isEquippedAtBeginning && item.equipped) {
            if (item instanceof Armor) {
                inventory.armors.filter(armor => armor !== item).forEach(armor => {
                    this.equipItem(creature, inventory, armor, false, false, false);
                });
            }

            if (item instanceof Shield) {
                inventory.shields.filter(shield => shield !== item).forEach(shield => {
                    this.equipItem(creature, inventory, shield, false, false, false);
                });
            }

            // If you get an Activity from an item that doesn't need to be invested,
            // immediately invest it in secret so the Activity is gained
            if ((item.gainActivities || item.activities) && !item.canInvest()) {
                this.investItem(creature, inventory, item, true, false);
            }

            // Add all Items that you get from equipping this one.
            if (item.gainItems && item.gainItems.length) {
                item.gainItems
                    .filter(gainItem => gainItem.on === 'equip')
                    .forEach(gainItem => {
                        this._itemGrantingService.grantGrantedItem(
                            gainItem,
                            creature,
                            { sourceName: item.effectiveName(), grantingItem: item },
                        );
                    });
            }
        } else if (isEquippedAtBeginning && !item.equipped) {
            if (equipBasicItems) {
                this._equipBasicItems(creature);
            }

            //If you are unequipping a shield, you should also be lowering it and losing cover
            if (item instanceof Shield) {
                if (item.takingCover) {
                    this._armorClassService.setCover(creature, 0, item);
                    item.takingCover = false;
                }

                item.raised = false;
            }

            //If the item was invested and the item, it isn't now.
            if (item.invested) {
                this.investItem(creature, inventory, item, false, false);
            }

            if (item.gainItems?.length) {
                item.gainItems.filter(gainItem => gainItem.on === 'equip').forEach(gainItem => {
                    this._itemGrantingService.dropGrantedItem(gainItem, creature);
                });
            }

            //If the item can't be un-invested, make sure you lose the conditions you gained from equipping it.
            if (!item.canInvest()) {
                this._creatureConditionsService.removeGainedItemConditions(creature, item);
            }

            item.propertyRunes?.forEach(rune => {
                //Deactivate any active toggled activities of inserted runes.
                rune.activities.filter(activity => activity.toggle && activity.active).forEach(activity => {
                    this._activitiesProcessingService.activateActivity(
                        activity,
                        false,
                        {
                            creature: this.character,
                            target: CreatureTypes.Character,
                            gain: activity,
                        },
                    );
                });
            });
        }

        if (changeAfter) {
            this._refreshService.processPreparedChanges();
        }
    }

    public investItem(creature: Creature, inventory: ItemCollection, item: Equipment, invest = true, changeAfter = true): void {
        item.invested = invest;
        this._refreshService.prepareDetailToChange(creature.type, 'inventory');
        this._refreshService.prepareDetailToChange(creature.type, item.id);

        if (item instanceof WornItem && item.gainSpells.length) {
            this._refreshService.prepareDetailToChange(creature.type, 'spellbook');
        }

        //Items are automatically equipped if they are invested.
        if (item.invested) {
            if (!item.equipped) {
                this.equipItem(creature, inventory, item, true, false);
            } else {
                this._refreshService.prepareChangesByItem(
                    creature,
                    item,
                );
            }
        } else {
            item.gainActivities.filter(gainActivity => gainActivity.active).forEach((gainActivity: ActivityGain) => {
                const libraryActivity = this._activitiesDataService.activities(gainActivity.name)[0];

                if (libraryActivity) {
                    this._activitiesProcessingService.activateActivity(
                        libraryActivity,
                        false,
                        {
                            creature,
                            gain: gainActivity,
                        },
                    );
                }
            });
            item.activities.filter(itemActivity => itemActivity.active).forEach((itemActivity: ItemActivity) => {
                this._activitiesProcessingService.activateActivity(
                    itemActivity,
                    false,
                    {
                        creature,
                        gain: itemActivity,
                    },
                );
            });
            this._creatureConditionsService.removeGainedItemConditions(creature, item);
            this._refreshService.prepareChangesByItem(
                creature,
                item,
            );
        }

        //If a wayfinder is invested or uninvested, all other invested wayfinders need to run updates as well,
        // Because too many invested wayfinders disable each other's aeon stones.
        if (item instanceof WornItem && item.aeonStones.length) {
            creature.inventories[0].wornitems.filter(wornItem => wornItem !== item && wornItem.aeonStones.length).forEach(wornItem => {
                this._refreshService.prepareChangesByItem(
                    creature,
                    wornItem,
                );
            });
        }

        if (changeAfter) {
            this._refreshService.processPreparedChanges();
        }
    }

    public useConsumable(creature: Creature, item: Consumable, preserveItem = false): void {
        if (!preserveItem) {
            item.amount--;
        }

        this._itemProcessingService.processConsumable(creature, item);
        this._refreshService.prepareChangesByItem(
            creature,
            item,
        );
        this._refreshService.prepareDetailToChange(creature.type, 'inventory');
    }

    public creatureHasCondition(creature: Creature, name: string): boolean {
        return !!this._creatureConditionsService.currentCreatureConditions(creature, { name }, { readonly: true }).length;
    }

    public addCondition(): boolean { return false; }

    /**
     * Try to remove the condition and return whether it was removed.
     */
    public removeCondition(): boolean { return false; }

    public creatureFromMessage(message: PlayerMessage): Creature {
        return this.allAvailableCreatures().find(creature => creature.id === message.targetId);
    }

    public messageSenderName(message: PlayerMessage): string {
        return this._savegamesService.savegames().find(savegame => savegame.id === message.senderId)?.name;
    }

    public sendTurnChangeToPlayers(): void {
        //Don't send messages in GM mode or manual mode, or if not logged in.
        if (this.isGMMode || this.isManualMode || !this.isLoggedIn()) {
            return;
        }

        this._messagesService.timeFromConnector()
            .pipe(
                switchMap(result => {
                    const timeStamp = result.time;
                    const character = this.character;
                    const targets =
                        this._savegamesService.savegames()
                            .filter(savegame => savegame.partyName === character.partyName && savegame.id !== character.id);
                    const messages: Array<PlayerMessage> = [];

                    targets.forEach(target => {
                        const message = new PlayerMessage();

                        message.recipientId = target.id;
                        message.senderId = character.id;
                        message.targetId = '';

                        const date = new Date();

                        message.time = `${ date.getHours() }:${ date.getMinutes() }`;
                        message.timeStamp = timeStamp;
                        message.turnChange = true;
                        messages.push(message);
                    });

                    if (messages.length) {
                        return this._messagesService.sendMessagesToConnector(messages);
                    }
                }),
            )
            .subscribe({
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._configService.logout('Your login is no longer valid; The event was not sent.');
                    } else {
                        this._toastService.show('An error occurred while sending effects. See console for more information.');
                        console.error(`Error saving effect messages to database: ${ error.message }`);
                    }
                },
            });
    }

    public applyTurnChangeMessage(messages: Array<PlayerMessage>): void {
        //Don't receive messages in manual mode.
        if (this.isManualMode) {
            return;
        }

        //For each senderId that you have a turnChange message from, remove all conditions that came from this sender and have duration 2.
        Array.from(new Set(
            messages
                .filter(message => message.selected)
                .map(message => message.senderId),
        )).forEach(senderId => {
            let hasConditionBeenRemoved = false;

            this.allAvailableCreatures().forEach(creature => {
                this._creatureConditionsService.currentCreatureConditions(creature)
                    .filter(existingConditionGain =>
                        existingConditionGain.foreignPlayerId === senderId &&
                        existingConditionGain.durationEndsOnOtherTurnChange,
                    )
                    .forEach(existingConditionGain => {
                        hasConditionBeenRemoved =
                            this._creatureConditionsService.removeCondition(creature, existingConditionGain, false);

                        if (hasConditionBeenRemoved) {
                            const senderName =
                                this._savegamesService.savegames().find(savegame => savegame.id === senderId)?.name || 'Unknown';

                            this._toastService.show(
                                `Automatically removed <strong>${ existingConditionGain.name }`
                                + `${ existingConditionGain.choice ? `: ${ existingConditionGain.choice }` : '' }`
                                + `</strong> condition from <strong>${ creature.name || creature.type }`
                                + `</strong> on turn of <strong>${ senderName }</strong>`);
                            this._refreshService.prepareDetailToChange(creature.type, 'effects');
                        }
                    });
            });
        });
        messages.forEach(message => {
            this._messagesService.markMessageAsIgnored(message);
        });
    }

    public sendConditionToPlayers(targets: Array<SpellTarget>, conditionGain: ConditionGain, activate = true): void {
        //Don't send messages in GM mode or manual mode, or if not logged in.
        if (this.isGMMode || this.isManualMode || !this.isLoggedIn()) {
            return;
        }

        this._messagesService.timeFromConnector()
            .pipe(
                switchMap(result => {
                    const timeStamp = result.time;
                    const creatures = this.allAvailableCreatures();
                    const messages: Array<PlayerMessage> = [];

                    targets.forEach(target => {
                        if (creatures.some(creature => creature.id === target.id)) {
                            //Catch any messages that go to your own creatures
                            this._creatureConditionsService.addCondition(this.creatureFromType(target.type), conditionGain);
                        } else {
                            // Build a message to the correct player and creature,
                            // with the timestamp just received from the database connector.
                            const message = new PlayerMessage();

                            message.recipientId = target.playerId;
                            message.senderId = this.character.id;
                            message.targetId = target.id;

                            const date = new Date();

                            message.time = `${ date.getHours() }:${ date.getMinutes() }`;
                            message.timeStamp = timeStamp;
                            message.gainCondition.push(conditionGain.clone());

                            if (message.gainCondition.length) {
                                message.gainCondition[0].foreignPlayerId = message.senderId;
                            }

                            message.activateCondition = activate;
                            messages.push(message);
                        }
                    });

                    if (messages.length) {
                        return this._messagesService.sendMessagesToConnector(messages)
                            .pipe(
                                tap({
                                    complete: () => {
                                        //If messages were sent, send a summary toast.
                                        this._toastService.show(`Sent effects to ${ messages.length } targets.`);
                                    },
                                }),
                            );
                    }
                }),
            )
            .subscribe({
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._configService.logout(
                            'Your login is no longer valid; The conditions were not sent. '
                            + 'Please try again after logging in; If you have wasted an action or spell this way, '
                            + 'you can enable Manual Mode in the settings to restore them.',
                        );
                    } else {
                        this._toastService.show('An error occurred while sending effects. See console for more information.');
                        console.error(`Error saving effect messages to database: ${ error.message }`);
                    }
                },
            });
    }

    public applyMessageConditions(messages: Array<PlayerMessage>): void {
        //Don't receive messages in manual mode.
        if (this.isManualMode) {
            return;
        }

        // Iterate through all messages that have a gainCondition (only one per message will be applied)
        // and either add or remove the appropriate conditions.
        // The ConditionGains have a foreignPlayerId that allows us to recognize that they came from this player.
        messages.forEach(message => {
            if (message.selected) {
                const targetCreature = this.creatureFromMessage(message);

                if (message.activateCondition) {
                    if (targetCreature && message.gainCondition.length) {
                        const conditionGain: ConditionGain = message.gainCondition[0];
                        const hasConditionBeenAdded =
                            this._creatureConditionsService.addCondition(targetCreature, conditionGain, {}, { noReload: true });

                        if (hasConditionBeenAdded) {
                            const senderName = this.messageSenderName(message);

                            //If a condition was created, send a toast to inform the user.
                            this._toastService.show(
                                `Added <strong>${ conditionGain.name }`
                                + `${ conditionGain.choice ? `: ${ conditionGain.choice }` : '' }</strong> condition to <strong>`
                                + `${ targetCreature.name || targetCreature.type }</strong> (sent by <strong>`
                                + `${ senderName.trim() }</strong>)`);
                        }
                    }
                } else {
                    if (targetCreature && message.gainCondition.length) {
                        const conditionGain: ConditionGain = message.gainCondition[0];
                        let hasConditionBeenRemoved = false;

                        this._creatureConditionsService.currentCreatureConditions(targetCreature, { name: message.gainCondition[0].name })
                            .filter(existingConditionGain =>
                                existingConditionGain.foreignPlayerId === message.senderId &&
                                existingConditionGain.source === message.gainCondition[0].source,
                            )
                            .forEach(existingConditionGain => {
                                hasConditionBeenRemoved =
                                    this._creatureConditionsService.removeCondition(targetCreature, existingConditionGain, false);
                            });

                        if (hasConditionBeenRemoved) {
                            const senderName = this.messageSenderName(message);

                            //If a condition was removed, send a toast to inform the user.
                            this._toastService.show(
                                `Removed <strong>${ conditionGain.name }`
                                + `${ conditionGain.choice ? `: ${ conditionGain.choice }` : '' }</strong> condition from <strong>`
                                + `${ targetCreature.name || targetCreature.type }</strong> (added by <strong>`
                                + `${ senderName.trim() }</strong>)`);
                        }
                    }
                }
            }

            this._messagesService.markMessageAsIgnored(message);
        });
    }

    public sendItemsToPlayer(sender: Creature, target: SpellTarget, item: Item, amount = 0): void {
        //Don't send messages in GM mode or manual mode, or if not logged in.
        if (this.isGMMode || this.isManualMode || !this.isLoggedIn()) {
            return;
        }

        this._messagesService.timeFromConnector()
            .pipe(
                switchMap(result => {
                    const timeStamp = result.time;

                    if (!amount) {
                        amount = item.amount;
                    }

                    this._itemTransferService.updateGrantingItemBeforeTransfer(sender, item);

                    const included: { items: Array<Item>; inventories: Array<ItemCollection> } =
                        this._itemTransferService.packGrantingItemForTransfer(sender, item);
                    //Build a message to the correct player and creature, with the timestamp just received from the database connector.
                    const message = new PlayerMessage();

                    message.recipientId = target.playerId;
                    message.senderId = this.character.id;
                    message.targetId = target.id;

                    const date = new Date();

                    message.time = `${ date.getHours() }:${ date.getMinutes() }`;
                    message.timeStamp = timeStamp;
                    message.offeredItem.push(item.clone(this._itemsDataService),
                    );
                    message.itemAmount = amount;
                    message.includedItems = included.items;
                    message.includedInventories = included.inventories;

                    return this._messagesService.sendMessagesToConnector([message])
                        .pipe(
                            tap({
                                complete: () => {
                                    //If the message was sent, send a summary toast.
                                    this._toastService.show(`Sent item offer to <strong>${ target.name }</strong>.`);
                                },
                            }),
                        );
                }),
            )
            .subscribe({
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._configService.logout(
                            'Your login is no longer valid; The item offer was not sent. Please try again after logging in.',
                        );
                    } else {
                        this._toastService.show('An error occurred while sending item. See console for more information.');
                        console.error(`Error saving item message to database: ${ error.message }`);
                    }
                },
            });
    }

    public applyMessageItems(messages: Array<PlayerMessage>): void {
        //Don't receive messages in manual mode.
        if (this.isManualMode) {
            return;
        }

        //Iterate through all messages that have an offeredItem (only one per message will be applied) and add the items.
        messages.forEach(message => {
            const targetCreature = this.creatureFromMessage(message);

            if (message.selected) {
                const sender = this.messageSenderName(message);

                if (targetCreature && message.offeredItem.length) {
                    // We can't use grant_InventoryItem,
                    // because these items are initialized and possibly bringing their own inventories and gained items.
                    // We have to process the item directly here.
                    if (targetCreature.isCharacter() || targetCreature.isAnimalCompanion()) {
                        const targetInventory = targetCreature.inventories[0];
                        let addedPrimaryItem: Item;

                        message.offeredItem.concat(message.includedItems).forEach(item => {
                            if (item === message.offeredItem[0]) {
                                item.amount = message.itemAmount;
                            }

                            const typedItem = TypeService.castItemByType(item);
                            const existingItems =
                                targetInventory[typedItem.type]
                                    .filter((existing: Item) =>
                                        existing.name === typedItem.name &&
                                        existing.canStack() &&
                                        !typedItem.expiration,
                                    );

                            // If any existing, stackable items are found, add this item's amount on top and finish.
                            // If no items are found, add the new item to the inventory
                            // and process it as a new item (skipping gained items and gained inventories).
                            if (existingItems.length) {
                                existingItems[0].amount += typedItem.amount;

                                if (typedItem.id === message.offeredItem[0].id) {
                                    addedPrimaryItem = existingItems[0];
                                }

                                this._refreshService.prepareDetailToChange(targetCreature.type, 'inventory');
                                this._refreshService.setComponentChanged(existingItems[0].id);
                            } else {
                                typedItem.recast(this._itemsDataService);

                                const newLength = targetInventory[typedItem.type].push(typedItem);
                                const addedItem = targetInventory[typedItem.type][newLength - 1];

                                this._refreshService.prepareDetailToChange(targetCreature.type, 'inventory');

                                if (item.id === message.offeredItem[0].id) {
                                    addedPrimaryItem = addedItem;
                                }

                                this.processGrantedItem((targetCreature), addedItem, targetInventory, true, false, true, true);
                            }
                        });
                        //Add included inventories and process all items inside them.
                        message.includedInventories.forEach(inventory => {
                            const newLength = targetCreature.inventories.push(inventory);
                            const newInventory = targetCreature.inventories[newLength - 1];

                            newInventory.allItems().forEach(invItem => {
                                this.processGrantedItem((targetCreature), invItem, newInventory, true, false, true, true);
                            });
                        });

                        if (addedPrimaryItem) {
                            //Build a toast message and send it.
                            let text = 'Received <strong>';

                            if (message.itemAmount > 1) {
                                text += `${ message.itemAmount } `;
                            }

                            text += addedPrimaryItem.effectiveName();

                            if (sender) {
                                text += `</strong> from <strong>${ sender }</strong>`;
                            }

                            if (message.includedItems.length || message.includedInventories.length) {
                                text += ', including ';

                                const includedText: Array<string> = [];

                                if (message.includedItems.length) {
                                    includedText.push(`${ message.includedItems.length } extra items`);
                                }

                                if (message.includedInventories.length) {
                                    includedText.push(`${ message.includedInventories.length } containers`);
                                }

                                text += includedText.join(' and ');
                            }

                            text += '.';
                            this._toastService.show(text);
                            //Build a response message that lets the other player know that the item has been accepted.
                            this.sendItemAcceptedMessage(message);
                        }
                    }
                }
            } else {
                //Build a response message that lets the other player know that the item has been rejected.
                this.sendItemAcceptedMessage(message, false);
            }

            this._messagesService.markMessageAsIgnored(message);
        });
    }

    public sendItemAcceptedMessage(message: PlayerMessage, accepted = true): void {
        //Don't send messages in GM mode or manual mode, or if not logged in.
        if (this.isGMMode || this.isManualMode || !this.isLoggedIn()) {
            return;
        }

        this._messagesService.timeFromConnector()
            .pipe(
                switchMap(result => {
                    const timeStamp = result.time;
                    //Build a message to the correct player and creature, with the timestamp just received from the database connector.
                    const response = new PlayerMessage();

                    response.recipientId = message.senderId;
                    response.senderId = this.character.id;
                    response.targetId = message.senderId;

                    const target = this.messageSenderName(message) || 'sender';
                    const date = new Date();

                    response.time = `${ date.getHours() }:${ date.getMinutes() }`;
                    response.timeStamp = timeStamp;
                    response.itemAmount = message.itemAmount;

                    if (accepted) {
                        response.acceptedItem = message.offeredItem[0].id;
                    } else {
                        response.rejectedItem = message.offeredItem[0].id;
                    }

                    return this._messagesService.sendMessagesToConnector([response])
                        .pipe(
                            tap({
                                complete: () => {
                                    //If the message was sent, send a summary toast.
                                    if (accepted) {
                                        this._toastService.show(`Sent acceptance response to <strong>${ target }</strong>.`);
                                    } else {
                                        this._toastService.show(`Sent rejection response to <strong>${ target }</strong>.`);
                                    }
                                },
                            }),
                        );
                }),
            )
            .subscribe({
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._configService.logout(
                            'Your login is no longer valid; The item acceptance message could not be sent, '
                            + 'but you have received the item. Your party member should drop the item manually.',
                        );
                    } else {
                        this._toastService.show('An error occurred while sending response. See console for more information.');
                        console.error(`Error saving response message to database: ${ error.message }`);
                    }
                },
            });
    }

    public applyItemAcceptedMessages(messages: Array<PlayerMessage>): void {
        //Don't receive messages in manual mode.
        if (this.isManualMode) {
            return;
        }

        //Iterate through all messages that have an offeredItem (only one per message will be applied) and add the items.
        messages.forEach(message => {
            const sender = this.messageSenderName(message) || 'The player ';

            if (message.acceptedItem || message.rejectedItem) {
                let foundItem: Item;
                let foundInventory: ItemCollection;
                let foundCreature: Creature;
                let itemName = 'item';

                this.allAvailableCreatures().forEach(creature => {
                    creature.inventories.forEach(inventory => {
                        if (!foundItem) {
                            foundItem = inventory.allItems().find(invItem => invItem.id === (message.acceptedItem || message.rejectedItem));
                            foundInventory = inventory;
                            foundCreature = creature;
                        }
                    });
                });

                if (foundItem) {
                    itemName = foundItem.effectiveName();
                }

                if (message.acceptedItem) {
                    this._toastService.show(
                        `<strong>${ sender }</strong> has accepted the <strong>`
                        + `${ itemName }</strong>. The item is dropped from your inventory.`,
                    );

                    if (foundItem) {
                        this.dropInventoryItem(foundCreature, foundInventory, foundItem, false, true, true, message.itemAmount);
                    }
                } else if (message.rejectedItem) {
                    this._toastService.show(
                        `<strong>${ sender }</strong> has rejected the <strong>`
                        + `${ itemName }</strong>. The item will remain in your inventory.`,
                    );
                }
            }

            this._messagesService.markMessageAsIgnored(message);
        });
        this._refreshService.processPreparedChanges();
    }

    public prepareOnceEffect(
        creature: Creature,
        effectGain: EffectGain,
        conditionValue = 0,
        conditionHeightened = 0,
        conditionChoice = '',
        conditionSpellCastingAbility = '',
    ): void {
        this._preparedOnceEffects.push({
            creatureType: creature.type,
            effectGain,
            conditionValue,
            conditionHeightened,
            conditionChoice,
            conditionSpellCastingAbility,
        });
    }

    public processPreparedOnceEffects(): void {
        // Make a copy of the prepared OnceEffects and clear the original.
        // Some OnceEffects can cause effects to be regenerated, which calls this function again,
        // so we need to clear them to avoid duplicate applications.
        const preparedOnceEffects = this._preparedOnceEffects.slice();

        this._preparedOnceEffects.length = 0;
        preparedOnceEffects.forEach(prepared => {
            this.processOnceEffect(
                this.creatureFromType(prepared.creatureType),
                prepared.effectGain,
                prepared.conditionValue,
                prepared.conditionHeightened,
                prepared.conditionChoice,
                prepared.conditionSpellCastingAbility,
            );
        });
    }

    public effectRecipientPhrases(creature: Creature): EffectRecipientPhrases {
        const phrases = {
            name: '',
            pronounCap: 'It',
            pronoun: 'it',
            pronounGenitive: 'its',
            verbIs: 'is',
            verbHas: 'is',
        };

        if (creature.isCharacter()) {
            phrases.name = 'You';
            phrases.pronounCap = 'You';
            phrases.pronoun = 'you';
            phrases.pronounGenitive = 'your';
            phrases.verbIs = 'are';
            phrases.verbHas = 'have';
        } else if (creature.isAnimalCompanion()) {
            phrases.name = this.companion.name || 'Your animal companion';
        } else if (creature.isFamiliar()) {
            phrases.name = this.familiar.name || 'Your familiar';
        }

        return phrases;
    }

    public changeCharacterFocusPointsWithNotification(value: number): void {
        const maxFocusPoints = this.maxFocusPoints();
        const character = this.character;

        if (maxFocusPoints === 0) {
            this._toastService.show('Your focus points were not changed because you don\'t have a focus pool.');

            return;
        }

        character.class.focusPoints = Math.min(character.class.focusPoints, maxFocusPoints);
        // We intentionally add the point after we set the limit.
        // This allows us to gain focus points with feats and raise the current points
        // before the limit is increased. The focus points are automatically limited in the spellbook component,
        // where they are displayed, and when casting focus spells.
        character.class.focusPoints += value;

        if (value >= 0) {
            this._toastService.show(`You gained ${ value } focus point${ value === 1 ? '' : 's' }.`);
        } else {
            this._toastService.show(`You lost ${ value * -1 } focus point${ value === 1 ? '' : 's' }.`);
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
    }

    public changeCreatureTemporaryHPWithNotification(
        creature: Creature,
        value: number,
        context: { source: string; sourceId: string },
    ): void {
        const phrases = this.effectRecipientPhrases(creature);

        // When you get temporary HP, some things to process:
        // - If you already have temporary HP, add this amount to the selection.
        //   The player needs to choose one amount; they are not cumulative.
        // - If you are setting temporary HP manually, or if the current amount is 0,
        //   skip the selection and remove all the other options.
        // - If you are losing temporary HP, lose only those that come from the same source.
        // -- If that's the current effective amount, remove all other options
        //    (if you are "using" your effective temporary HP, we assume that you have made the choice for this amount).
        // --- If the current amount is 0 after loss, reset the temporary HP.
        // -- Remove it if it's not the effective amount.
        if (value > 0) {
            if (context.source === 'Manual') {
                creature.health.temporaryHP[0] = { amount: value, source: context.source, sourceId: '' };
                creature.health.temporaryHP.length = 1;
                this._toastService.show(`${ phrases.name } gained ${ value } temporary HP.`);
            } else if (creature.health.temporaryHP[0].amount === 0) {
                creature.health.temporaryHP[0] = { amount: value, source: context.source, sourceId: context.sourceId };
                creature.health.temporaryHP.length = 1;
                this._toastService.show(`${ phrases.name } gained ${ value } temporary HP from ${ context.source }.`);
            } else {
                creature.health.temporaryHP.push({ amount: value, source: context.source, sourceId: context.sourceId });
                this._toastService.show(
                    `${ phrases.name } gained ${ value } temporary HP from ${ context.source }. `
                    + `${ phrases.name } already had temporary HP and must choose which amount to keep.`,
                );
            }
        } else if (value < 0) {
            const targetTempHPSet =
                creature.health.temporaryHP
                    .find(tempHPSet =>
                        ((tempHPSet.source === 'Manual') && (context.source === 'Manual')) ||
                        tempHPSet.sourceId === context.sourceId,
                    );

            if (targetTempHPSet) {
                targetTempHPSet.amount += value;

                if (targetTempHPSet === creature.health.temporaryHP[0]) {
                    creature.health.temporaryHP.length = 1;

                    if (targetTempHPSet.amount <= 0) {
                        creature.health.temporaryHP[0] = { amount: 0, source: '', sourceId: '' };
                    }

                    this._toastService.show(`${ phrases.name } lost ${ value * -1 } temporary HP.`);
                } else {
                    if (targetTempHPSet.amount <= 0) {
                        creature.health.temporaryHP.splice(creature.health.temporaryHP.indexOf(targetTempHPSet), 1);
                    }

                    this._toastService.show(
                        `${ phrases.name } lost ${ value * -1 } of the temporary HP gained from ${ context.source }. `
                        + `This is not the set of temporary HP that ${ phrases.pronoun } ${ phrases.verbIs } currently using.`,
                    );
                }
            }
        }

        this._refreshService.prepareDetailToChange(creature.type, 'health');
        //Update Health and Time because having multiple temporary HP keeps you from ticking time and resting.
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'health');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'time');
    }

    public changeCreatureHPWithNotification(creature: Creature, value: number, context: { source: string }): void {
        const phrases = this.effectRecipientPhrases(creature);

        if (value > 0) {
            const result = this._healthService.heal(creature.health, creature, value, true);
            let results = '';

            if (result.hasRemovedUnconscious) {
                results = ` This removed ${ phrases.pronounGenitive } Unconscious condition.`;
            }

            if (result.hasRemovedDying) {
                results = ` This removed ${ phrases.pronounGenitive } Dying condition.`;
            }

            this._toastService.show(`${ phrases.name } gained ${ value } HP from ${ context.source }.${ results }`);
        } else if (value < 0) {
            const result = this._healthService.takeDamage(creature.health, creature, -value, false);
            let results = '';

            if (result.hasAddedUnconscious) {
                results = ` ${ phrases.name } ${ phrases.verbIs } now Unconscious.`;
            }

            if (result.dyingAddedAmount && context.source !== 'Dead') {
                results = ` ${ phrases.pronounCap } ${ phrases.verbIs } now Dying ${ result.dyingAddedAmount }.`;
            }

            if (result.hasRemovedUnconscious) {
                results = ` This removed ${ phrases.pronounGenitive } Unconscious condition.`;
            }

            this._toastService.show(`${ phrases.name } lost ${ value * -1 } HP from ${ context.source }.${ results }`);
        }

        this._refreshService.prepareDetailToChange(creature.type, 'health');
        this._refreshService.prepareDetailToChange(creature.type, 'effects');
    }

    public raiseCharacterShieldWithNotification(value: number): void {
        const equippedShield = this.character.inventories[0].shields.find(shield => shield.equipped);

        if (equippedShield) {
            if (value > 0) {
                equippedShield.raised = true;
                this._toastService.show('Your shield was raised.');
            } else {
                equippedShield.raised = false;
                this._toastService.show('Your shield was lowered.');
            }

            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'defense');
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');
        }
    }

    public changeCreatureCoverWithNotification(creature: Creature, value: number): void {
        const phrases = this.effectRecipientPhrases(creature);

        this._armorClassService.setCover(creature, value, null);

        switch (value) {
            case CoverTypes.NoCover:
                this._toastService.show(`${ phrases.name } ${ phrases.verbIs } no longer taking cover.`);
                break;
            case CoverTypes.LesserCover:
                this._toastService.show(`${ phrases.name } now ${ phrases.verbHas } lesser cover.`);
                break;
            case CoverTypes.Cover:
                this._toastService.show(`${ phrases.name } now ${ phrases.verbHas } standard cover.`);
                break;
            case CoverTypes.GreaterCover:
                this._toastService.show(`${ phrases.name } now ${ phrases.verbHas } greater cover.`);
                break;
            default: break;
        }
    }

    public processOnceEffect(
        creature: Creature,
        effectGain: EffectGain,
        conditionValue = 0,
        conditionHeightened = 0,
        conditionChoice = '',
        conditionSpellCastingAbility = '',
    ): void {
        let value = 0;

        try {
            // We eval the effect value by sending it to the evaluationService
            // with some additional attributes and receive the resulting effect.
            if (effectGain.value) {
                const testObject = {
                    spellSource: effectGain.spellSource,
                    value: conditionValue,
                    heightened: conditionHeightened,
                    choice: conditionChoice,
                    spellCastingAbility: conditionSpellCastingAbility,
                };
                const validationResult =
                    this._evaluationService.valueFromFormula(
                        effectGain.value,
                        { creature, object: testObject, effect: effectGain },
                    );

                if (validationResult && typeof validationResult === 'number') {
                    value = validationResult;
                }
            }
        } catch (error) {
            value = 0;
        }

        const phrases = {
            name: '',
            pronounCap: 'It',
            pronoun: 'it',
            pronounGenitive: 'its',
            verbIs: 'is',
            verbHas: 'is',
        };

        if (creature.isCharacter()) {
            phrases.name = 'You';
            phrases.pronounCap = 'You';
            phrases.pronoun = 'you';
            phrases.pronounGenitive = 'your';
            phrases.verbIs = 'are';
            phrases.verbHas = 'have';
        } else if (creature.isAnimalCompanion()) {
            phrases.name = this.companion.name || 'Your animal companion';
        } else if (creature.isFamiliar()) {
            phrases.name = this.familiar.name || 'Your familiar';
        }

        switch (effectGain.affected) {
            case 'Focus Points':
                this.changeCharacterFocusPointsWithNotification(value);

                break;
            case 'Temporary HP':
                this.changeCreatureTemporaryHPWithNotification(
                    creature,
                    value,
                    { source: effectGain.source, sourceId: effectGain.sourceId },
                );

                break;
            case 'HP':
                this.changeCreatureHPWithNotification(creature, value, { source: effectGain.source });

                break;
            case 'Raise Shield': {
                this.raiseCharacterShieldWithNotification(value);

                break;
            }
            case 'Cover':
                this.changeCreatureCoverWithNotification(creature, value);

                break;
            default: break;
        }
    }

    public abilities(name = ''): Array<Ability> {
        return this._abilitiesDataService.abilities(name);
    }

    public skills(
        creature: Creature,
        name = '',
        filter: { type?: string; locked?: boolean } = {},
        options: { noSubstitutions?: boolean } = {},
    ): Array<Skill> {
        return this._skillsDataService.skills(creature.customSkills, name, filter, options);
    }

    public feats(name = '', type = ''): Array<Feat> {
        return this._featsDataService.feats(this.character.customFeats, name, type);
    }

    public featsAndFeatures(name = '', type = '', includeSubTypes = false, includeCountAs = false): Array<Feat> {
        //Use this function very sparingly! See get_All() for details.
        return this._featsDataService.featsAndFeatures(this.character.customFeats, name, type, includeSubTypes, includeCountAs);
    }

    public characterFeatsAndFeatures(name = '', type = '', includeSubTypes = false, includeCountAs = false): Array<Feat> {
        return this._characterFeatsService.characterFeats(this.character.customFeats, name, type, includeSubTypes, includeCountAs);
    }

    public characterHasFeat(name: string, levelNumber: number = this._character.level): boolean {
        return !!this.characterFeatsTaken(0, levelNumber, { featName: name }, { includeCountAs: true }).length;
    }

    public characterFeatsTaken(
        minLevelNumber = 0,
        maxLevelNumber = this._character.level,
        filter: { featName?: string; source?: string; sourceId?: string; locked?: boolean; automatic?: boolean } = {},
        options: { excludeTemporary?: boolean; includeCountAs?: boolean } = {},
    ): Array<FeatTaken> {
        filter = {
            locked: undefined,
            automatic: undefined,
            ...filter,
        };

        // If the feat choice is not needed (i.e. if excludeTemporary is not given),
        // we can get the taken feats quicker from the featsService.
        // CharacterService.get_CharacterFeatsTaken should be preferred over Character.takenFeats for this reason.
        if (!options.excludeTemporary) {
            return this._characterFeatsService.characterFeatsTaken(
                minLevelNumber,
                maxLevelNumber,
                filter.featName,
                filter.source,
                filter.sourceId,
                filter.locked,
                options.includeCountAs,
                filter.automatic,
            );
        } else {
            return this.character.takenFeats(
                minLevelNumber,
                maxLevelNumber,
                filter.featName,
                filter.source,
                filter.sourceId,
                filter.locked,
                options.excludeTemporary,
                options.includeCountAs,
                filter.automatic,
            );
        }
    }

    public creatureHealth(creature: Creature): Health {
        return creature.health;
    }

    public animalCompanionLevels(): Array<AnimalCompanionLevel> {
        return this._animalCompanionsDataService.companionLevels();
    }

    public creatureSenses(creature: Creature, charLevel: number = this.character.level, allowTemporary = false): Array<string> {
        let senses: Array<string> = [];

        let ancestrySenses: Array<string>;

        if (creature.isFamiliar()) {
            ancestrySenses = creature.senses;
        } else {
            ancestrySenses = (creature as AnimalCompanion | Character).class?.ancestry?.senses;
        }

        if (ancestrySenses.length) {
            senses.push(...ancestrySenses);
        }

        if (creature.isCharacter()) {
            const heritageSenses = creature.class.heritage.senses;

            if (heritageSenses.length) {
                senses.push(...heritageSenses);
            }

            this.characterFeatsAndFeatures()
                .filter(feat => feat.senses?.length && this.characterHasFeat(feat.name, charLevel))
                .forEach(feat => {
                    senses.push(...feat.senses);
                });
        }

        if (creature.isFamiliar()) {
            creature.abilities.feats
                .map(gain => this._familiarsDataService.familiarAbilities(gain.name)[0])
                .filter(ability => ability?.senses.length)
                .forEach(ability => {
                    senses.push(...ability.senses);
                });
        }

        if (allowTemporary) {
            senses.push(...this.sensesGrantedByEquipment(creature));
            this._creatureConditionsService.currentCreatureConditions(creature)
                .filter(gain => gain.apply)
                .forEach(gain => {
                    const condition = this._conditionsDataService.conditionFromName(gain.name);

                    if (condition?.senses.length) {
                        //Add all non-excluding senses.
                        senses.push(
                            ...condition.senses
                                .filter(sense =>
                                    !sense.excluding &&
                                    (!sense.conditionChoiceFilter.length || sense.conditionChoiceFilter.includes(gain.choice)))
                                .map(sense => sense.name),
                        );
                        //Remove all excluding senses.
                        condition.senses
                            .filter(sense =>
                                sense.excluding &&
                                (!sense.conditionChoiceFilter.length || sense.conditionChoiceFilter.includes(gain.choice)),
                            )
                            .forEach(sense => {
                                senses = senses.filter(existingSense => existingSense !== sense.name);
                            });
                    }
                });
        }

        return Array.from(new Set(senses));
    }

    public sensesGrantedByEquipment(creature: Creature): Array<string> {
        const senses: Array<string> = [];

        creature.inventories[0].allEquipment().filter(equipment => equipment.gainSenses.length && equipment.investedOrEquipped())
            .forEach(equipment => {
                senses.push(...equipment.gainSenses);
            });

        return senses;
    }

    public characterFeatsShowingHintsOnThis(objectName = 'all'): Array<Feat> {
        return this.characterFeatsAndFeatures().filter(feat =>
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
            ) && this.characterHasFeat(feat.name),
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

            companion.class.levels = this.animalCompanionLevels();
            this._equipBasicItems(companion);
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

    private _markUnneededWeaponFeatsForDeletion(weapon: Weapon): void {
        //If there are no weapons left of this name in any inventory, find any custom feat that has it as its subType.
        //These feats are not useful anymore, but the player may wish to keep them.
        //They are marked with canDelete, and the player can decide whether to delete them.
        const character = this.character;
        const remainingWeapons: Array<string> = []
            .concat(
                ...character.inventories
                    .concat(
                        character.class?.animalCompanion?.inventories || [],
                        character.class?.familiar?.inventories || [],
                    )
                    .map(inventory => inventory.weapons))
            .filter(inventoryWeapon =>
                inventoryWeapon.name.toLowerCase() === weapon.name.toLowerCase() &&
                inventoryWeapon !== weapon,
            );

        if (!remainingWeapons.length) {
            character.customFeats
                .filter(customFeat => customFeat.generatedWeaponFeat && customFeat.subType === weapon.name)
                .forEach(customFeat => {
                    customFeat.canDelete = true;
                });
        }
    }

    private _preserveInventoryContentBeforeDropping(creature: Creature, item: Equipment): void {
        // This gets all inventories granted by an item and dumps them into the main inventory.
        // That way, content isn't lost when you drop an inventory item.
        let found = 0;

        creature.inventories.filter(inv => inv.itemId === item.id).forEach(inv => {
            inv.allItems().filter(invItem => invItem !== item)
                .forEach(invItem => {
                    if (!invItem.markedForDeletion) {
                        found++;
                        this._itemTransferService
                            .moveItemLocally(creature, invItem, creature.inventories[0], inv, invItem.amount, true);
                    }
                });
        });

        if (found) {
            this._toastService.show(
                `${ found } item${ found > 1 ? 's' : '' } were emptied out of <strong>${ item.effectiveName() }</strong> `
                + 'before dropping the item. These items can be found in your inventory, unless they were dropped in the same process.',
            );
        }
    }

    private _grantBasicItems(): void {
        //This function depends on the items being loaded, and it will wait forever for them!
        const waitForItemsService = setInterval(() => {
            if (!this._extensionsService.stillLoading && !this._configService.stillLoading) {
                clearInterval(waitForItemsService);

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
                this._equipBasicItems(this.character, false);
                this._equipBasicItems(this.companion, false);
            }
        }, Defaults.waitForServiceDelay);
    }

    private _equipBasicItems(creature: Creature, changeAfter = true): void {
        if (!this.stillLoading && this._basicItems.weapon && this._basicItems.armor && !(creature.isFamiliar())) {
            if (!creature.inventories[0].weapons.some(weapon => !weapon.broken) && (creature.isCharacter())) {
                this.grantInventoryItem(
                    this._basicItems.weapon,
                    { creature, inventory: creature.inventories[0] },
                    { changeAfter: false, equipAfter: false },
                );
            }

            if (!creature.inventories[0].armors.some(armor => !armor.broken)) {
                this.grantInventoryItem(
                    this._basicItems.armor,
                    { creature, inventory: creature.inventories[0] },
                    { changeAfter: false, equipAfter: false },
                );
            }

            if (!creature.inventories[0].weapons.some(weapon => weapon.equipped === true)) {
                if (creature.inventories[0].weapons.some(weapon => !weapon.broken)) {
                    this.equipItem(
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
                    this.equipItem(
                        creature,
                        creature.inventories[0],
                        creature.inventories[0].armors.find(armor => !armor.broken),
                        true,
                        changeAfter,
                    );
                }
            }
        }
    }

}
