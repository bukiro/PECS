/* eslint-disable complexity */
/* eslint-disable max-lines */
import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { Skill } from 'src/app/classes/Skill';
import { switchMap, tap } from 'rxjs';
import { Item } from 'src/app/classes/Item';
import { Class } from 'src/app/classes/Class';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { SkillsService } from 'src/app/services/skills.service';
import { Level } from 'src/app/classes/Level';
import { ClassesService } from 'src/app/services/classes.service';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Armor } from 'src/app/classes/Armor';
import { Weapon } from 'src/app/classes/Weapon';
import { FeatsService } from 'src/app/services/feats.service';
import { TraitsService } from 'src/app/services/traits.service';
import { Ancestry } from 'src/app/classes/Ancestry';
import { HistoryService } from 'src/app/services/history.service';
import { Heritage } from 'src/app/classes/Heritage';
import { Background } from 'src/app/classes/Background';
import { ItemsService } from 'src/app/services/items.service';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { ConditionsService } from 'src/app/services/conditions.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { Activity } from 'src/app/classes/Activity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { SpellsService } from 'src/app/services/spells.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Consumable } from 'src/app/classes/Consumable';
import { TimeService } from 'src/app/services/time.service';
import { DefenseService } from 'src/app/services/defense.service';
import { Equipment } from 'src/app/classes/Equipment';
import { EffectGain } from 'src/app/classes/EffectGain';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { Rune } from 'src/app/classes/Rune';
import { DeitiesService } from 'src/app/services/deities.service';
import { Deity } from 'src/app/classes/Deity';
import { AnimalCompanionsService } from 'src/app/services/animalcompanions.service';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { SavegameService } from 'src/app/services/savegame.service';
import { FamiliarsService } from 'src/app/services/familiars.service';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { Oil } from 'src/app/classes/Oil';
import { WornItem } from 'src/app/classes/WornItem';
import { Savegame } from 'src/app/classes/Savegame';
import { ArmorRune } from 'src/app/classes/ArmorRune';
import { Ammunition } from 'src/app/classes/Ammunition';
import { Shield } from 'src/app/classes/Shield';
import { AlchemicalBomb } from 'src/app/classes/AlchemicalBomb';
import { Snare } from 'src/app/classes/Snare';
import { OtherConsumableBomb } from 'src/app/classes/OtherConsumableBomb';
import { Creature } from 'src/app/classes/Creature';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { ConfigService } from 'src/app/services/config.service';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { PlayerMessage } from 'src/app/classes/PlayerMessage';
import { MessageService } from 'src/app/services/message.service';
import { ToastService } from 'src/app/services/toast.service';
import { Material } from 'src/app/classes/Material';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { NgbPopoverConfig, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { ConditionSet } from 'src/app/classes/ConditionSet';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { FeatTaken } from 'src/app/character-creation/definitions/models/FeatTaken';
import { TypeService } from 'src/app/services/type.service';
import { EvaluationService } from 'src/app/services/evaluation.service';
import { EffectsGenerationService } from 'src/app/services/effectsGeneration.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { CacheService } from 'src/app/services/cache.service';
import { AdditionalHeritage } from '../classes/AdditionalHeritage';
import { ActivitiesProcessingService } from './activities-processing.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { Speed } from '../classes/Speed';
import { AbilityModFromAbilityValue } from 'src/libs/shared/util/abilityUtils';
import { Specialization } from '../classes/Specialization';
import { FloorNumbersLastDigits } from 'src/libs/shared/util/numberUtils';
import { CopperAmounts, CurrencyIndices } from 'src/libs/shared/definitions/currency';
import { Condition } from '../classes/Condition';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { HttpStatusCode } from '@angular/common/http';
import { AC, CoverTypes } from '../classes/AC';
import { Ability } from '../classes/Ability';
import { Health } from '../classes/Health';
import { AnimalCompanionLevel } from '../classes/AnimalCompanionLevel';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { CreatureTypeIds } from 'src/libs/shared/definitions/creatureTypeIds';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';

interface PreparedOnceEffect {
    creatureType: string;
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

type HintShowingItem = Equipment | Oil | WornItem | ArmorRune | WeaponRune | Material;

@Injectable({
    providedIn: 'root',
})
export class CharacterService {

    private readonly _menuState = {
        [MenuNames.ItemsMenu]: 'out' as 'in' | 'out',
        [MenuNames.CraftingMenu]: 'out' as 'in' | 'out',
        [MenuNames.CharacterMenu]: 'in' as 'in' | 'out',
        [MenuNames.CompanionMenu]: 'out' as 'in' | 'out',
        [MenuNames.FamiliarMenu]: 'out' as 'in' | 'out',
        [MenuNames.SpellsMenu]: 'out' as 'in' | 'out',
        [MenuNames.SpellLibraryMenu]: 'out' as 'in' | 'out',
        [MenuNames.ConditionsMenu]: 'out' as 'in' | 'out',
        [MenuNames.DiceMenu]: 'out' as 'in' | 'out',
    };

    private readonly _menuMatchingComponent = {
        [MenuNames.ItemsMenu]: 'items',
        [MenuNames.CraftingMenu]: 'crafting',
        [MenuNames.CharacterMenu]: 'charactersheet',
        [MenuNames.CompanionMenu]: 'companion',
        [MenuNames.FamiliarMenu]: 'familiar',
        [MenuNames.SpellsMenu]: 'spells',
        [MenuNames.SpellLibraryMenu]: 'spelllibrary',
        [MenuNames.ConditionsMenu]: 'conditions',
        [MenuNames.DiceMenu]: 'dice',
    };

    private _itemsMenuTarget: 'Character' | 'Companion' | 'Familiar' = 'Character';

    private _character: Character = new Character();
    private _loader: Array<Partial<Character>> = [];
    private _loading = false;
    private _basicItems: { weapon: Weapon; armor: Armor } = { weapon: null, armor: null };
    private _isFirstLoad = true;
    private _loadingStatus = 'Loading';
    private _preparedOnceEffects: Array<PreparedOnceEffect> = [];

    constructor(
        private readonly _configService: ConfigService,
        private readonly _extensionsService: ExtensionsService,
        private readonly _savegameService: SavegameService,
        public abilitiesService: AbilitiesDataService,
        public skillsService: SkillsService,
        public classesService: ClassesService,
        public featsService: FeatsService,
        public traitsService: TraitsService,
        private readonly _historyService: HistoryService,
        public conditionsService: ConditionsService,
        public activitiesService: ActivitiesDataService,
        public itemsService: ItemsService,
        public spellsService: SpellsService,
        public effectsService: EffectsService,
        public timeService: TimeService,
        public defenseService: DefenseService,
        public deitiesService: DeitiesService,
        public animalCompanionsService: AnimalCompanionsService,
        public familiarsService: FamiliarsService,
        private readonly _messageService: MessageService,
        public toastService: ToastService,
        private readonly _typeService: TypeService,
        private readonly _evaluationService: EvaluationService,
        private readonly _effectsGenerationService: EffectsGenerationService,
        public refreshService: RefreshService,
        public cacheService: CacheService,
        popoverConfig: NgbPopoverConfig,
        tooltipConfig: NgbTooltipConfig,
        public activitiesProcessingService: ActivitiesProcessingService,
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

    public get loadingStatus(): string {
        return this._loadingStatus;
    }

    public setLoadingStatus(status: string, refreshTopBar = true): void {
        this._loadingStatus = status || 'Loading';

        if (refreshTopBar) {
            this.refreshService.set_Changed('top-bar');
        }
    }

    public darkmode(): boolean {
        if (!this.stillLoading) {
            return this.character().settings.darkmode;
        } else {
            return true;
        }
    }

    public isFirstLoad(): boolean {
        return this._isFirstLoad;
    }

    public toggleMenu(menu?: MenuNames): void {
        const refreshDelay = 400;

        this._isFirstLoad = false;

        if (menu) {
            if (this._menuState[menu] === 'out') {
                this._menuState[menu] = 'in';
                this.refreshService.set_Changed(this._menuMatchingComponent[menu]);
            } else {
                this._menuState[menu] = 'out';
                setTimeout(() => {
                    this.refreshService.set_Changed(this._menuMatchingComponent[menu]);
                }, refreshDelay);
            }

            this._menuState[menu] = (this._menuState[menu] === 'out') ? 'in' : 'out';
        }

        Object.values(MenuNames).forEach(menuName => {
            if (
                menu !== menuName &&
                !(menu === MenuNames.DiceMenu && [MenuNames.CompanionMenu, MenuNames.FamiliarMenu].includes(menuName))
            ) {
                if (this._menuState[menuName] === 'in') {
                    this._menuState[menuName] = 'out';
                    setTimeout(() => {
                        this.refreshService.set_Changed(this._menuMatchingComponent[menuName]);
                    }, refreshDelay);
                }
            }
        });

        this.refreshService.set_Changed('top-bar');
        this.refreshService.process_ToChange();
    }

    public characterMenuState(): 'in' | 'out' {
        return this._menuState.character;
    }

    public companionMenuState(): 'in' | 'out' {
        return this._menuState.companion;
    }

    public familiarMenuState(): 'in' | 'out' {
        return this._menuState.familiar;
    }

    public itemsMenuState(): 'in' | 'out' {
        return this._menuState.items;
    }

    public craftingMenuState(): 'in' | 'out' {
        return this._menuState.crafting;
    }

    public spellsMenuState(): 'in' | 'out' {
        return this._menuState.spells;
    }

    public spellLibraryMenuState(): 'in' | 'out' {
        return this._menuState.spelllibrary;
    }

    public conditionsMenuState(): 'in' | 'out' {
        return this._menuState.conditions;
    }

    public diceMenuState(): 'in' | 'out' {
        return this._menuState.dice;
    }

    public itemsMenuTarget(): 'Character' | 'Companion' | 'Familiar' {
        return this._itemsMenuTarget;
    }

    public setItemsMenuTarget(target: 'Character' | 'Companion' | 'Familiar' = 'Character'): void {
        this._itemsMenuTarget = target;
        this.refreshService.set_Changed('itemstore');
    }

    public creatureFromType(type: string): Character | AnimalCompanion | Familiar {
        switch (type.toLowerCase()) {
            case 'character':
                return this.character();
            case 'companion':
                return this.companion();
            case 'familiar':
                return this.familiar();
            default:
                return new Character();
        }
    }

    public character(): Character {
        if (!this.stillLoading) {
            return this._character;
        } else { return new Character(); }
    }

    public companion(): AnimalCompanion {
        return this.character().class?.animalCompanion || new AnimalCompanion();
    }

    public familiar(): Familiar {
        return this.character().class?.familiar || new Familiar();
    }

    public isBlankCharacter(): boolean {
        // The character is blank if textboxes haven't been used, no class and no basevalues have been chosen,
        // and no items have been added other than the starter items.
        const character = this.character();
        const characterStartingInventoryAmount = 2;
        const characterStartingItemAmount = 2;

        return (
            !character.class?.name &&
            !character.name &&
            !character.partyName &&
            !character.experiencePoints &&
            !character.alignment &&
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

    public isGMMode(): boolean {
        return this.character().GMMode;
    }

    public isManualMode(): boolean {
        return this.character().settings.manualMode;
    }

    public isLoggedIn(): boolean {
        return this._configService.isLoggedIn;
    }

    public isCompanionAvailable(charLevel: number = this.character().level): boolean {
        //Return any feat that grants an animal companion that you own.
        return this.characterFeatsAndFeatures()
            .some(feat =>
                feat.gainAnimalCompanion === 'Young' &&
                feat.have({ creature: this.character() }, { characterService: this }, { charLevel }),
            );
    }

    public isFamiliarAvailable(charLevel: number = this.character().level): boolean {
        //Return any feat that grants an animal companion that you own.
        return this.characterFeatsAndFeatures()
            .some(feat =>
                feat.gainFamiliar &&
                feat.have({ creature: this.character() }, { characterService: this }, { charLevel }),
            );
    }

    public allAvailableCreatures(
        companionAvailable: boolean = this.isCompanionAvailable(),
        familiarAvailable: boolean = this.isFamiliarAvailable(),
    ): Array<Creature> {
        if (!this.stillLoading) {
            if (companionAvailable && familiarAvailable) {
                return ([] as Array<Creature>).concat(this.character()).concat(this.companion())
                    .concat(this.familiar());
            } else if (companionAvailable) {
                return ([] as Array<Creature>).concat(this.character()).concat(this.companion());
            } else if (familiarAvailable) {
                return ([] as Array<Creature>).concat(this.character()).concat(this.familiar());
            } else {
                return ([] as Array<Creature>).concat(this.character());
            }
        } else { return [new Character()]; }
    }

    public loadOrResetCharacter(id = '', loadAsGM = false): void {
        this._loading = true;
        this.reset(id, loadAsGM);
    }

    public setAccent(): void {
        document.documentElement.style.setProperty('--accent', this._rgbAccent());
    }

    public setDarkmode(): void {
        if (this.darkmode()) {
            document.body.classList.add('darkmode');
        } else {
            document.body.classList.remove('darkmode');
        }
    }

    public characterClasses(name: string): Array<Class> {
        return this.classesService.classes(name);
    }

    public deities(name = ''): Array<Deity> {
        return this.deitiesService.deities(name);
    }

    public currentCharacterDeities(character: Character, source = '', level: number = character.level): Array<Deity> {
        return this.deitiesService.currentCharacterDeities(this, character, source, level);
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
        const character = this.character();
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
            const baseIntelligence: number = this.abilities('Intelligence')[0]?.baseValue(character, this, 0)?.result;
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
                                this._effectsGenerationService.get_EffectsFromObject(
                                    feat,
                                    { characterService: this },
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
                const levelIntelligence: number = this.abilities('Intelligence')[0]?.baseValue(character, this, level.number)?.result;

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
            this.effectsService.get_RelativesOnThis(this.character(), 'Max Languages').forEach(effect => {
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
            const currentInt = this.abilities('Intelligence')[0]?.mod(character, this, this.effectsService)?.result;
            const diff = currentInt - int[character.level];

            if (diff > 0 && currentInt > 0) {
                languageSources.push({ name: 'Intelligence', level: temporarySourceLevel, amount: Math.min(diff, currentInt) });
            }

            //Remove all free languages that have not been filled.
            character.class.languages = character.class.languages.sort().filter(language => !(language.name === '' && !language.locked));

            // Make a new list of all the free languages.
            // We will pick and sort the free languages from here into the character language list.
            const tempLanguages: Array<LanguageGain> =
                character.class.languages
                    .filter(language => !language.locked)
                    .map(language => Object.assign(new LanguageGain(), JSON.parse(JSON.stringify(language))));

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
                            const newLanguage =
                                Object.assign<LanguageGain, LanguageGain>(new LanguageGain(), JSON.parse(JSON.stringify(existingLanguage)));

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

    public changeClass($class: Class): void {
        //Cleanup Heritage, Ancestry, Background and class skills
        const character = this.character();

        character.class.processRemovingOldHeritage(this);
        character.class.processRemovingOldAncestry(this);
        character.class.processRemovingOldBackground(this);
        character.class.processRemovingOldClass(this);
        character.class = Object.assign(new Class(), JSON.parse(JSON.stringify($class))).recast(this._typeService, this.itemsService);
        character.class.processNewClass(this, this.itemsService);
        this.deitiesService.clearCharacterDeities();
        this.cacheService.resetCreatureCache(character.typeId);
        this.refreshService.set_Changed();
    }

    public changeAncestry(ancestry: Ancestry, itemsService: ItemsService): void {
        const character = this.character();

        this.changeHeritage(new Heritage());
        character.class.processRemovingOldAncestry(this);
        character.class.ancestry = new Ancestry();
        character.class.ancestry = Object.assign(new Ancestry(), JSON.parse(JSON.stringify(ancestry))).recast();
        character.class.processNewAncestry(this, itemsService);
        this.cacheService.resetCreatureCache(character.typeId);
        this.updateLanguageList();
    }

    public changeDeity(deity: Deity): void {
        const character = this.character();

        character.class.deity = deity.name;
        this.deitiesService.clearCharacterDeities();
        this.refreshService.set_ToChange('Character', 'general');
        this.refreshService.set_ToChange('Character', 'spells', 'clear');
        this.refreshService.set_ToChange('Character', 'spellchoices');
        this.refreshService.set_ToChange('Character', 'featchoices');
        this.refreshService.set_ToChange('Character', 'attacks');
    }

    public changeHeritage(heritage: Heritage, index = -1): void {
        const character = this.character();

        character.class.processRemovingOldHeritage(this, index);

        if (index === -1) {
            character.class.heritage = new Heritage();
            character.class.heritage = Object.assign<Heritage, Heritage>(new Heritage(), JSON.parse(JSON.stringify(heritage))).recast();
        } else {
            const heritageToChange = character.class.additionalHeritages[index];
            const source = heritageToChange.source;
            const levelNumber = heritageToChange.charLevelAvailable;

            character.class.additionalHeritages[index] = Object.assign<AdditionalHeritage, AdditionalHeritage>(new AdditionalHeritage(),
                {
                    ...JSON.parse(JSON.stringify(heritage)),
                    source,
                    charLevelAvailable: levelNumber,
                }).recast();
        }

        character.class.processNewHeritage(this, this.itemsService, index);
        this.cacheService.resetCreatureCache(character.typeId);
    }

    public changeBackground(background: Background): void {
        const character = this.character();

        character.class.processRemovingOldBackground(this);
        character.class.background = new Background();
        character.class.background = Object.assign(new Background(), JSON.parse(JSON.stringify(background))).recast();
        character.class.processNewBackground(this);
        this.cacheService.resetCreatureCache(character.typeId);
    }

    public cleanItems(): ItemCollection {
        return this.itemsService.get_CleanItems();
    }

    public itemGroupSpecializations(group = ''): Array<Specialization> {
        return this.itemsService.get_Specializations(group);
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
        this.refreshService.set_ToChange(context.creature.type, 'inventory');
        this.refreshService.set_ToChange(context.creature.type, 'effects');
        this.refreshService.set_ToChange('Character', 'top-bar');

        const newInventoryItem =
            this.itemsService.initialize_Item(item, { newId: options.newId, newPropertyRunes: options.newPropertyRunes });
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
            this.refreshService.set_ToChange('Character', returnedItem.id);
        } else {
            const newInventoryLength = context.inventory[newInventoryItem.type].push(newInventoryItem);
            const newItem = context.inventory[newInventoryItem.type][newInventoryLength - 1];

            if (context.amount > 1) {
                newItem.amount = context.amount;
            }

            if (options.expiration) {
                newItem.expiration = options.expiration;
            }

            returnedItem = this.processGrantedItem(context.creature, newItem, context.inventory, options.equipAfter, options.resetRunes);
        }

        if (options.changeAfter) {
            this.refreshService.process_ToChange();
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
    ): Item {
        this.refreshService.set_ToChange(creature.type, 'inventory');

        //Disable activities on equipment and runes. Refresh all affected components.
        if (((item instanceof Equipment) || (item instanceof Rune)) && item.activities?.length) {
            item.activities.forEach(activity => {
                activity.active = false;
                this.refreshService.set_HintsToChange(creature, activity.hints, { characterService: this });
            });
            this.refreshService.set_ToChange(creature.type, 'activities');
        }

        if ((item instanceof Equipment) || (item instanceof Rune) || (item instanceof Oil)) {
            this.refreshService.set_HintsToChange(creature, item.hints, { characterService: this });
        }

        if (item instanceof Equipment) {
            if (item.gainActivities?.length) {
                item.gainActivities.forEach(gain => {
                    gain.active = false;
                });
                this.refreshService.set_ToChange(creature.type, 'activities');
            }

            if (equip && Object.prototype.hasOwnProperty.call(item, 'equipped') && item.equippable) {
                this.equipItem(creature, inventory, item, true, false);
            }

            if (item instanceof Weapon) {
                const customFeats = this.featsService.create_WeaponFeats([item]);

                customFeats.forEach(customFeat => {
                    const oldFeat = this.character().customFeats.find(existingFeat => existingFeat.name === customFeat.name);

                    if (oldFeat) {
                        this.removeCustomFeat(oldFeat);
                    }

                    this.addCustomFeat(customFeat);
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
                        gainItem.grantGrantedItem(
                            creature,
                            { sourceName: item.effectiveName(), grantingItem: item },
                            { characterService: this, itemsService: this.itemsService },
                        );
                    });
                }
            }
        }

        if (item instanceof AlchemicalBomb || item instanceof OtherConsumableBomb || item instanceof Ammunition || item instanceof Snare) {
            this.refreshService.set_ToChange(creature.type, 'attacks');
        }

        return item;
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
        this.refreshService.set_ToChange(creature.type, 'inventory');
        this.refreshService.set_ToChange(creature.type, 'effects');
        this.refreshService.set_ToChange('Character', 'top-bar');
        this.refreshService.set_ItemViewChanges(creature, item, { characterService: this, activitiesService: this.activitiesService });

        if (amount < item.amount) {
            item.amount -= amount;
            this.refreshService.set_ToChange('Character', item.id);
        } else {
            if ((item instanceof Equipment) || (item instanceof Rune) || (item instanceof Oil)) {
                this.refreshService.set_HintsToChange(creature, item.hints, { characterService: this });
            }

            if ((item instanceof Equipment) || (item instanceof Rune)) {
                item.activities.forEach(activity => {
                    if (activity.active) {
                        this.activitiesProcessingService.activateActivity(
                            creature,
                            '',
                            this,
                            this.conditionsService,
                            this.itemsService,
                            this.spellsService,
                            activity,
                            activity,
                            false,
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
                    this.conditionsService.removeGainedItemConditions(creature, item, this);
                }

                if (item.propertyRunes) {
                    item.propertyRunes.filter((rune: Rune) => rune.loreChoices.length).forEach((rune: Rune) => {
                        this.removeRuneLore(rune);
                    });
                }

                if (item.gainActivities) {
                    item.gainActivities.forEach(gain => {
                        if (gain.active) {
                            this.activitiesProcessingService.activateActivity(
                                creature,
                                '',
                                this,
                                this.conditionsService,
                                this.itemsService,
                                this.spellsService,
                                gain,
                                this.activitiesService.activities(gain.name)[0],
                                false,
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
                        gainItem.dropGrantedItem(creature, {}, { characterService: this });
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
            this.refreshService.set_ToChange(creature.type, 'attacks');
        }

        if (changeAfter) {
            this.refreshService.process_ToChange();
        }

        this.refreshService.set_Changed(item.id);
    }

    public addRuneLore(rune: Rune): void {
        //Go through all the loreChoices (usually only one)
        rune.loreChoices.forEach(choice => {
            // Check if only one (=this) item's rune has this lore
            // (and therefore no other item has already created it on the character), and if so, create it.
            if (
                this.character().inventories[0]?.allEquipment()
                    .filter(item => item.propertyRunes
                        .some(propertyRune => propertyRune.loreChoices
                            .some(otherchoice => otherchoice.loreName === choice.loreName),
                        ),
                    ).length +
                this.character().inventories[0]?.allEquipment()
                    .filter(item => item.oilsApplied
                        .some(oil => oil.runeEffect && oil.runeEffect.loreChoices
                            .some(otherchoice => otherchoice.loreName === choice.loreName),
                        ),
                    ).length === 1) {
                this.character().addLore(this, choice);
            }
        });
    }

    public removeRuneLore(rune: Rune): void {
        //Iterate through the loreChoices (usually only one)
        rune.loreChoices.forEach(choice => {
            //Check if only one item's rune has this lore (and therefore no other rune still needs it created), and if so, remove it.
            if (this.character().inventories[0]?.allEquipment()
                .filter(item => item.propertyRunes
                    .filter(propertyRune => propertyRune.loreChoices
                        .filter(otherchoice => otherchoice.loreName === choice.loreName)
                        .length)
                    .length)
                .length +
                this.character().inventories[0]?.allEquipment()
                    .filter(item => item.oilsApplied
                        .filter(oil => oil.runeEffect && oil.runeEffect.loreChoices
                            .filter(otherchoice => otherchoice.loreName === choice.loreName)
                            .length)
                        .length)
                    .length === 1) {
                this.character().removeLore(this, choice);
            }
        });
    }

    public changeCash(multiplier = 1, sum: number, plat = 0, gold = 0, silver = 0, copper = 0): void {
        const platIn100Plat = 100;
        const decimal = 10;

        if (sum) {
            //Resolve a sum (in copper) into platinum, gold, silver and copper.
            // Gold is prioritised - only gold amounts over 1000 are exchanged for platinum.
            plat = gold = silver = copper = 0;
            plat = Math.floor(sum / CopperAmounts.CopperIn100Platinum) * platIn100Plat;
            sum %= CopperAmounts.CopperIn100Platinum;
            gold = Math.floor(sum / CopperAmounts.CopperInGold);
            sum %= CopperAmounts.CopperInGold;
            silver = Math.floor(sum / CopperAmounts.CopperInSilver);
            sum %= CopperAmounts.CopperInSilver;
            copper = sum;
        }

        if (copper) {
            this.character().cash[CurrencyIndices.Copper] += (copper * multiplier);

            if (
                this.character().cash[CurrencyIndices.Copper] < 0 &&
                (
                    this.character().cash[CurrencyIndices.Silver] > 0 ||
                    this.character().cash[CurrencyIndices.Gold] > 0 ||
                    this.character().cash[CurrencyIndices.Platinum] > 0
                )
            ) {
                silver += Math.floor(this.character().cash[CurrencyIndices.Copper] / decimal) * multiplier;
                this.character().cash[CurrencyIndices.Copper] -= FloorNumbersLastDigits(this.character().cash[CurrencyIndices.Copper], 1);
            }

        }

        if (silver) {
            this.character().cash[CurrencyIndices.Silver] += (silver * multiplier);

            if (
                this.character().cash[CurrencyIndices.Silver] < 0 &&
                (
                    this.character().cash[CurrencyIndices.Gold] > 0 ||
                    this.character().cash[CurrencyIndices.Platinum] > 0
                )
            ) {
                gold += Math.floor(this.character().cash[CurrencyIndices.Silver] / decimal) * multiplier;
                this.character().cash[CurrencyIndices.Silver] -= FloorNumbersLastDigits(this.character().cash[CurrencyIndices.Silver], 1);
            }
        }

        if (gold) {
            this.character().cash[1] += (gold * multiplier);

            if (
                this.character().cash[CurrencyIndices.Gold] < 0 &&
                this.character().cash[CurrencyIndices.Platinum] > 0
            ) {
                plat += Math.floor(this.character().cash[CurrencyIndices.Gold] / decimal) * multiplier;
                this.character().cash[CurrencyIndices.Gold] -= FloorNumbersLastDigits(this.character().cash[CurrencyIndices.Gold], 1);
            }
        }

        if (plat) {
            this.character().cash[CurrencyIndices.Platinum] += (plat * multiplier);

            if (this.character().cash[CurrencyIndices.Platinum] < 0) {
                this.sortCash();
            }
        }

        if (
            this.character().cash[CurrencyIndices.Platinum] < 0 ||
            this.character().cash[CurrencyIndices.Gold] < 0 ||
            this.character().cash[CurrencyIndices.Silver] < 0
        ) {
            this.sortCash();
        }

        this.refreshService.set_ToChange('Character', 'inventory');
    }

    public sortCash(): void {
        const sum =
            (this.character().cash[CurrencyIndices.Platinum] * CopperAmounts.CopperInPlatinum)
            + (this.character().cash[CurrencyIndices.Gold] * CopperAmounts.CopperInGold)
            + (this.character().cash[CurrencyIndices.Silver] * CopperAmounts.CopperInSilver)
            + (this.character().cash[CurrencyIndices.Copper]);

        this.character().cash = [0, 0, 0, 0];
        this.changeCash(1, sum);
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
                ((creature instanceof Character) !== item.traits.includes('Companion'))
            ) && (
                !(creature instanceof Familiar) ||
                !(item instanceof Armor || item instanceof Weapon || item instanceof Shield)
            )
        );

        if (canEquip()) {
            item.equipped = equip;
        } else {
            item.equipped = false;
        }

        this.refreshService.set_ToChange(creature.type, 'inventory');
        this.refreshService.set_ItemViewChanges(creature, item, { characterService: this, activitiesService: this.activitiesService });

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
                        gainItem.grantGrantedItem(
                            creature,
                            { sourceName: item.effectiveName(), grantingItem: item },
                            { characterService: this, itemsService: this.itemsService },
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
                    this.ACObject().setCover(creature, 0, item, this, this.conditionsService);
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
                    gainItem.dropGrantedItem(creature, {}, { characterService: this });
                });
            }

            //If the item can't be un-invested, make sure you lose the conditions you gained from equipping it.
            if (!item.canInvest()) {
                this.conditionsService.removeGainedItemConditions(creature, item, this);
            }

            item.propertyRunes?.forEach(rune => {
                //Deactivate any active toggled activities of inserted runes.
                rune.activities.filter(activity => activity.toggle && activity.active).forEach(activity => {
                    this.activitiesProcessingService.activateActivity(
                        this.character(),
                        'Character',
                        this,
                        this.conditionsService,
                        this.itemsService,
                        this.spellsService,
                        activity,
                        activity,
                        false,
                    );
                });
            });
        }

        if (changeAfter) {
            this.refreshService.process_ToChange();
        }
    }

    public investItem(creature: Creature, inventory: ItemCollection, item: Equipment, invest = true, changeAfter = true): void {
        item.invested = invest;
        this.refreshService.set_ToChange(creature.type, 'inventory');
        this.refreshService.set_ToChange(creature.type, item.id);

        if (item instanceof WornItem && item.gainSpells.length) {
            this.refreshService.set_ToChange(creature.type, 'spellbook');
        }

        //Items are automatically equipped if they are invested.
        if (item.invested) {
            if (!item.equipped) {
                this.equipItem(creature, inventory, item, true, false);
            } else {
                this.refreshService.set_ItemViewChanges(
                    creature,
                    item,
                    { characterService: this, activitiesService: this.activitiesService },
                );
            }
        } else {
            item.gainActivities.filter(gainActivity => gainActivity.active).forEach((gainActivity: ActivityGain) => {
                const libraryActivity = this.activitiesService.activities(gainActivity.name)[0];

                if (libraryActivity) {
                    this.activitiesProcessingService.activateActivity(
                        creature,
                        '',
                        this,
                        this.conditionsService,
                        this.itemsService,
                        this.spellsService,
                        gainActivity,
                        libraryActivity,
                        false,
                    );
                }
            });
            item.activities.filter(itemActivity => itemActivity.active).forEach((itemActivity: ItemActivity) => {
                this.activitiesProcessingService.activateActivity(
                    creature,
                    '',
                    this,
                    this.conditionsService,
                    this.itemsService,
                    this.spellsService,
                    itemActivity,
                    itemActivity,
                    false,
                );
            });
            this.conditionsService.removeGainedItemConditions(creature, item, this);
            this.refreshService.set_ItemViewChanges(creature, item, { characterService: this, activitiesService: this.activitiesService });
        }

        //If a wayfinder is invested or uninvested, all other invested wayfinders need to run updates as well,
        // Because too many invested wayfinders disable each other's aeon stones.
        if (item instanceof WornItem && item.aeonStones.length) {
            creature.inventories[0].wornitems.filter(wornItem => wornItem !== item && wornItem.aeonStones.length).forEach(wornItem => {
                this.refreshService.set_ItemViewChanges(
                    creature,
                    wornItem,
                    { characterService: this, activitiesService: this.activitiesService },
                );
            });
        }

        if (changeAfter) {
            this.refreshService.process_ToChange();
        }
    }

    public useConsumable(creature: Creature, item: Consumable, preserveItem = false): void {
        if (!preserveItem) {
            item.amount--;
        }

        this.itemsService.process_Consumable(creature, this, this.conditionsService, this.spellsService, item);
        this.refreshService.set_ItemViewChanges(creature, item, { characterService: this, activitiesService: this.activitiesService });
        this.refreshService.set_ToChange(creature.type, 'inventory');
    }

    public addCustomSkill(skillName: string, type: string, abilityName: string, locked = false, recallKnowledge = false): void {
        this.character().customSkills.push(new Skill(abilityName, skillName, type, locked, recallKnowledge));
    }

    public removeCustomSkill(oldSkill: Skill): void {
        this.character().customSkills = this.character().customSkills.filter(skill => skill !== oldSkill);
    }

    public addCustomFeat(feat: Feat): void {
        this.character().customFeats.push(feat);
        this.refreshService.set_ToChange('Character', 'charactersheet');
    }

    public removeCustomFeat(feat: Feat): void {
        const character = this.character();

        character.customFeats = character.customFeats.filter(oldFeat => oldFeat !== feat);
    }

    public conditions(name = '', type = ''): Array<Condition> {
        return this.conditionsService.conditions(name, type);
    }

    public currentCreatureConditions(creature: Creature, name = '', source = '', readonly = false): Array<ConditionGain> {
        //Returns ConditionGain[] with apply=true/false for each
        return this.conditionsService.currentCreatureConditions(creature, this, creature.conditions, readonly).filter(condition =>
            (!name || condition.name === name) &&
            (!source || condition.source === source),
        );
    }

    public addCondition(
        creature: Creature,
        gain: ConditionGain,
        context: { parentItem?: Item; parentConditionGain?: ConditionGain } = {},
        options: { noReload?: boolean } = {},
    ): boolean {
        let shouldActivate = true;
        const workingGain: ConditionGain =
            Object.assign<ConditionGain, ConditionGain>(new ConditionGain(), JSON.parse(JSON.stringify(gain))).recast();
        const originalCondition = this.conditions(workingGain.name)[0];

        if (originalCondition) {
            if (workingGain.heightened < originalCondition.minLevel) {
                workingGain.heightened = originalCondition.minLevel;
            }

            //If the condition has an activationPrerequisite, test that first and only activate if it evaluates to a nonzero number.
            if (workingGain.activationPrerequisite) {
                const activationValue =
                    this._evaluationService.get_ValueFromFormula(
                        workingGain.activationPrerequisite,
                        { characterService: this, effectsService: this.effectsService },
                        { creature, parentConditionGain: context.parentConditionGain, parentItem: context.parentItem, object: workingGain },
                    );

                if (
                    !activationValue ||
                    activationValue === '0' ||
                    (
                        typeof activationValue === 'string' &&
                        !parseInt(activationValue, 10)
                    )
                ) {
                    shouldActivate = false;
                }
            }

            //Check if any condition denies this condition, and stop processing if that is the case.
            const denySources: Array<string> =
                this.currentCreatureConditions(creature, '', '', true)
                    .filter(existingGain => this.conditions(existingGain.name)?.[0]?.denyConditions.includes(workingGain.name))
                    .map(existingGain => `<strong>${ existingGain.name }</strong>`);

            if (denySources.length) {
                shouldActivate = false;
                this.toastService.show(
                    `The condition <strong>${ workingGain.name }</strong> was not added `
                    + `because it is blocked by: ${ denySources.join(', ') }`,
                );
            }

            if (shouldActivate) {
                // If the conditionGain has duration -5, use the default duration depending on spell level and effect choice.
                if (workingGain.duration === TimePeriods.Default) {
                    workingGain.duration = originalCondition.defaultDuration(workingGain.choice, workingGain.heightened).duration;
                }

                // If there are choices, and the choice is not set by the gain, take the default or the first choice.
                if (originalCondition.choices.length && !workingGain.choice) {
                    workingGain.choice = originalCondition.choice || originalCondition.choices[0].name;
                }

                // If there is a choice, check if there is a nextStage value of that choice and copy it to the condition gain.
                if (workingGain.choice) {
                    workingGain.nextStage = originalCondition.timeToNextStage(workingGain.choice);
                }

                if (workingGain.nextStage) {
                    this.refreshService.set_ToChange(creature.type, 'time');
                    this.refreshService.set_ToChange(creature.type, 'health');
                }

                if (workingGain.heightened < originalCondition.minLevel) {
                    workingGain.heightened = originalCondition.minLevel;
                }

                if (!workingGain.radius) {
                    workingGain.radius = originalCondition.radius;
                }

                // Set persistent if the condition is, unless ignorePersistent is set.
                // Don't just set gain.persistent = condition.persistent, because condition.persistent could be false.
                if (originalCondition.persistent && !workingGain.ignorePersistent) {
                    workingGain.persistent = true;
                }

                workingGain.decreasingValue = originalCondition.decreasingValue;
                workingGain.notes = originalCondition.notes;
                workingGain.showNotes = workingGain.notes && true;

                let newLength = 0;

                if (workingGain.addValue || workingGain.increaseRadius) {
                    const existingConditions = creature.conditions.filter(creatureGain => creatureGain.name === workingGain.name);

                    if (existingConditions.length) {
                        existingConditions.forEach(existingGain => {
                            existingGain.value += workingGain.addValue;
                            existingGain.radius = Math.max(0, existingGain.radius + workingGain.increaseRadius);

                            if (workingGain.addValueUpperLimit) {
                                existingGain.value = Math.min(existingGain.value, workingGain.addValueUpperLimit);
                            }

                            if (workingGain.addValueLowerLimit) {
                                existingGain.value = Math.max(existingGain.value, workingGain.addValueLowerLimit);
                            }

                            // If this condition gain has both locked properties and addValue,
                            // transfer these properties and change the parentID to this one,
                            // but only if the existing gain does not have them.
                            if (workingGain.lockedByParent && !existingGain.lockedByParent) {
                                existingGain.lockedByParent = true;
                                existingGain.parentID = workingGain.parentID;
                            }

                            if (workingGain.valueLockedByParent && !existingGain.valueLockedByParent) {
                                existingGain.valueLockedByParent = true;
                                existingGain.parentID = workingGain.parentID;
                            }

                            if (workingGain.persistent) {
                                existingGain.persistent = true;
                            }
                        });
                        this.refreshService.set_ToChange(creature.type, 'effects');
                    } else {
                        if (!workingGain.value) {
                            workingGain.value = workingGain.addValue;

                            if (workingGain.addValueUpperLimit) {
                                workingGain.value = Math.min(workingGain.value, workingGain.addValueUpperLimit);
                            }

                            if (workingGain.addValueLowerLimit) {
                                workingGain.value = Math.max(workingGain.value, workingGain.addValueLowerLimit);
                            }
                        }

                        if (!workingGain.radius) {
                            workingGain.radius = workingGain.increaseRadius;
                        }

                        if (workingGain.value > 0) {
                            newLength = creature.conditions.push(workingGain);
                        }
                    }
                } else {
                    //Don't add permanent persistent conditions without a value if the same condition already exists with these parameters.
                    //These will not automatically go away because they are persistent, so we don't need multiple instances of them.
                    if (
                        !(
                            !workingGain.value &&
                            workingGain.persistent &&
                            workingGain.durationIsPermanent &&
                            this.currentCreatureConditions(creature, '', '', true)
                                .some(existingGain =>
                                    existingGain.name === workingGain.name &&
                                    !existingGain.value &&
                                    existingGain.persistent &&
                                    existingGain.durationIsPermanent,
                                )
                        )
                    ) {
                        newLength = creature.conditions.push(workingGain);
                    }
                }

                if (newLength) {
                    this.conditionsService.processCondition(
                        creature,
                        this,
                        this.effectsService,
                        this.itemsService,
                        workingGain,
                        this.conditionsService.conditions(workingGain.name)[0],
                        true,
                    );
                    this.refreshService.set_ToChange(creature.type, 'effects');
                    this.refreshService.set_ToChange(creature.type, 'effects-component');

                    if (!options.noReload) {
                        this.refreshService.process_ToChange();
                    }

                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Try to remove the condition and return whether it was removed.
     */
    public removeCondition(
        creature: Creature,
        conditionGain: ConditionGain,
        reload = true,
        increaseWounded = true,
        keepPersistent = true,
        ignoreLockedByParent = false,
        ignoreEndsWithConditions = false,
    ): boolean {
        // Find the correct condition gain to remove.
        // This can be the exact same as the conditionGain parameter, but if it isn't, find the most similar one:
        // - Find all condition gains with similar name, value and source, then if there are more than one of those:
        // -- Try finding one that has the exact same attributes.
        // -- If none is found, find one that has the same duration.
        // - If none is found or the list has only one, take the first.
        let oldConditionGain: ConditionGain = creature.conditions.find(gain => gain === conditionGain);

        if (!oldConditionGain) {
            const oldConditionGains: Array<ConditionGain> =
                creature.conditions
                    .filter(gain =>
                        gain.name === conditionGain.name &&
                        gain.value === conditionGain.value &&
                        gain.source === conditionGain.source,
                    );

            if (oldConditionGains.length > 1) {
                oldConditionGain = oldConditionGains.find(gain => JSON.stringify(gain) === JSON.stringify(conditionGain));

                if (!oldConditionGain) {
                    oldConditionGain = oldConditionGains.find(gain => gain.duration === conditionGain.duration);
                }
            }

            if (!oldConditionGain) {
                oldConditionGain = oldConditionGains[0];
            }
        }

        const originalCondition = this.conditions(conditionGain.name)[0];

        //If this condition is locked by its parent, it can't be removed.
        if (oldConditionGain && (ignoreLockedByParent || !oldConditionGain.lockedByParent)) {
            if (oldConditionGain.nextStage || oldConditionGain.durationIsInstant) {
                this.refreshService.set_ToChange(creature.type, 'time');
                this.refreshService.set_ToChange(creature.type, 'health');
            }

            // Remove the parent lock for all conditions locked by this,
            // so that they can be removed in the next step or later (if persistent).
            this.removeLockedByParentFromMatchingConditions(creature, oldConditionGain.id);
            this.currentCreatureConditions(creature, '', oldConditionGain.name, true).filter(gain =>
                gain.parentID === oldConditionGain.id,
            )
                .forEach(extraCondition => {
                    if (!(keepPersistent && extraCondition.persistent)) {
                        // Remove child conditions that are not persistent, or remove all if keepPersistent is false.
                        this.removeCondition(
                            creature,
                            extraCondition,
                            false,
                            increaseWounded,
                            keepPersistent,
                            ignoreLockedByParent,
                            ignoreEndsWithConditions,
                        );
                    } else if (extraCondition.persistent) {
                        // If this condition adds persistent conditions, don't remove them,
                        // but remove the persistent flag as its parent is gone.
                        this.removePersistentFromCondition(creature, extraCondition);
                    }
                });
            creature.conditions.splice(creature.conditions.indexOf(oldConditionGain), 1);
            this.conditionsService.processCondition(
                creature,
                this,
                this.effectsService,
                this.itemsService,
                oldConditionGain,
                originalCondition,
                false,
                increaseWounded,
                ignoreEndsWithConditions,
            );

            if (oldConditionGain.source === 'Quick Status') {
                this.refreshService.set_ToChange(creature.type, 'defense');
                this.refreshService.set_ToChange(creature.type, 'attacks');
            }

            this.refreshService.set_ToChange(creature.type, 'effects');
            this.refreshService.set_ToChange(creature.type, 'effects-component');

            if (reload) {
                this.refreshService.process_ToChange();
            }

            return true;
        }

        return false;
    }

    public removePersistentFromCondition(creature: Creature, conditionGain: ConditionGain): void {
        //This function removes the persistent attribute from a condition gain, allowing it to be removed normally.
        //Find the correct condition to remove the persistent attribute:
        //- Find all persistent condition gains with similar name, value and source, then if there are more than one of those:
        //-- Try finding one that has the exact same attributes.
        //-- If none is found, find one that has the same duration.
        //- If none is found or the list has only one, take the first.
        let oldConditionGain: ConditionGain;
        const oldConditionGains: Array<ConditionGain> =
            creature.conditions
                .filter(gain => gain.name === conditionGain.name && gain.source === conditionGain.source && gain.persistent);

        if (oldConditionGains.length > 1) {
            oldConditionGain = oldConditionGains.find(gain => JSON.stringify(gain) === JSON.stringify(conditionGain));

            if (!oldConditionGain) {
                oldConditionGain = oldConditionGains.find(gain => gain.duration === conditionGain.duration);
            }
        }

        if (!oldConditionGain) {
            oldConditionGain = oldConditionGains[0];
        }

        if (oldConditionGain) {
            oldConditionGain.persistent = false;
        }
    }

    public removeLockedByParentFromMatchingConditions(creature: Creature, id: string): void {
        //This function removes the lockedByParent and valueLockedByParent attributes from all condition gains locked by the given ID.
        creature.conditions.filter(gain => gain.parentID === id).forEach(gain => {
            gain.lockedByParent = false;
            gain.valueLockedByParent = false;
        });
    }

    public creatureFromMessage(message: PlayerMessage): Creature {
        return this.allAvailableCreatures().find(creature => creature.id === message.targetId);
    }

    public messageSenderName(message: PlayerMessage): string {
        return this._savegameService.getSavegames().find(savegame => savegame.id === message.senderId)?.name;
    }

    public sendTurnChangeToPlayers(): void {
        //Don't send messages in GM mode or manual mode, or if not logged in.
        if (this.isGMMode() || this.isManualMode() || !this.isLoggedIn()) {
            return;
        }

        this._messageService.get_Time()
            .pipe(
                switchMap(result => {
                    const timeStamp = result.time;
                    const character = this.character();
                    const targets =
                        this._savegameService.getSavegames()
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
                        return this._messageService.send_Messages(messages);
                    }
                }),
            )
            .subscribe({
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._configService.logout('Your login is no longer valid; The event was not sent.');
                    } else {
                        this.toastService.show('An error occurred while sending effects. See console for more information.');
                        console.error(`Error saving effect messages to database: ${ error.message }`);
                    }
                },
            });
    }

    public applyTurnChangeMessage(messages: Array<PlayerMessage>): void {
        //Don't receive messages in manual mode.
        if (this.isManualMode()) {
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
                this.currentCreatureConditions(creature)
                    .filter(existingConditionGain =>
                        existingConditionGain.foreignPlayerId === senderId &&
                        existingConditionGain.durationEndsOnOtherTurnChange,
                    )
                    .forEach(existingConditionGain => {
                        hasConditionBeenRemoved = this.removeCondition(creature, existingConditionGain, false);

                        if (hasConditionBeenRemoved) {
                            const senderName =
                                this._savegameService.getSavegames().find(savegame => savegame.id === senderId)?.name || 'Unknown';

                            this.toastService.show(
                                `Automatically removed <strong>${ existingConditionGain.name }`
                                + `${ existingConditionGain.choice ? `: ${ existingConditionGain.choice }` : '' }`
                                + `</strong> condition from <strong>${ creature.name || creature.type }`
                                + `</strong> on turn of <strong>${ senderName }</strong>`);
                            this.refreshService.set_ToChange(creature.type, 'effects');
                        }
                    });
            });
        });
        messages.forEach(message => {
            this._messageService.mark_MessageAsIgnored(this, message);
        });
    }

    public sendConditionToPlayers(targets: Array<SpellTarget>, conditionGain: ConditionGain, activate = true): void {
        //Don't send messages in GM mode or manual mode, or if not logged in.
        if (this.isGMMode() || this.isManualMode() || !this.isLoggedIn()) {
            return;
        }

        this._messageService.get_Time()
            .pipe(
                switchMap(result => {
                    const timeStamp = result.time;
                    const creatures = this.allAvailableCreatures();
                    const messages: Array<PlayerMessage> = [];

                    targets.forEach(target => {
                        if (creatures.some(creature => creature.id === target.id)) {
                            //Catch any messages that go to your own creatures
                            this.addCondition(this.creatureFromType(target.type), conditionGain);
                        } else {
                            // Build a message to the correct player and creature,
                            // with the timestamp just received from the database connector.
                            const message = new PlayerMessage();

                            message.recipientId = target.playerId;
                            message.senderId = this.character().id;
                            message.targetId = target.id;

                            const date = new Date();

                            message.time = `${ date.getHours() }:${ date.getMinutes() }`;
                            message.timeStamp = timeStamp;
                            message.gainCondition.push(
                                Object.assign(new ConditionGain(), JSON.parse(JSON.stringify(conditionGain))).recast(),
                            );

                            if (message.gainCondition.length) {
                                message.gainCondition[0].foreignPlayerId = message.senderId;
                            }

                            message.activateCondition = activate;
                            messages.push(message);
                        }
                    });

                    if (messages.length) {
                        return this._messageService.send_Messages(messages)
                            .pipe(
                                tap({
                                    complete: () => {
                                        //If messages were sent, send a summary toast.
                                        this.toastService.show(`Sent effects to ${ messages.length } targets.`);
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
                        this.toastService.show('An error occurred while sending effects. See console for more information.');
                        console.error(`Error saving effect messages to database: ${ error.message }`);
                    }
                },
            });
    }

    public applyMessageConditions(messages: Array<PlayerMessage>): void {
        //Don't receive messages in manual mode.
        if (this.isManualMode()) {
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
                        const hasConditionBeenAdded = this.addCondition(targetCreature, conditionGain, {}, { noReload: true });

                        if (hasConditionBeenAdded) {
                            const senderName = this.messageSenderName(message);

                            //If a condition was created, send a toast to inform the user.
                            this.toastService.show(
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

                        this.currentCreatureConditions(targetCreature, message.gainCondition[0].name)
                            .filter(existingConditionGain =>
                                existingConditionGain.foreignPlayerId === message.senderId &&
                                existingConditionGain.source === message.gainCondition[0].source,
                            )
                            .forEach(existingConditionGain => {
                                hasConditionBeenRemoved = this.removeCondition(targetCreature, existingConditionGain, false);
                            });

                        if (hasConditionBeenRemoved) {
                            const senderName = this.messageSenderName(message);

                            //If a condition was removed, send a toast to inform the user.
                            this.toastService.show(
                                `Removed <strong>${ conditionGain.name }`
                                + `${ conditionGain.choice ? `: ${ conditionGain.choice }` : '' }</strong> condition from <strong>`
                                + `${ targetCreature.name || targetCreature.type }</strong> (added by <strong>`
                                + `${ senderName.trim() }</strong>)`);
                        }
                    }
                }
            }

            this._messageService.mark_MessageAsIgnored(this, message);
        });
    }

    public sendItemsToPlayer(sender: Creature, target: SpellTarget, item: Item, amount = 0): void {
        //Don't send messages in GM mode or manual mode, or if not logged in.
        if (this.isGMMode() || this.isManualMode() || !this.isLoggedIn()) {
            return;
        }

        this._messageService.get_Time()
            .pipe(
                switchMap(result => {
                    const timeStamp = result.time;

                    if (!amount) {
                        amount = item.amount;
                    }

                    this.itemsService.update_GrantingItem(sender, item);

                    const included: { items: Array<Item>; inventories: Array<ItemCollection> } =
                        this.itemsService.pack_GrantingItem(sender, item);
                    //Build a message to the correct player and creature, with the timestamp just received from the database connector.
                    const message = new PlayerMessage();

                    message.recipientId = target.playerId;
                    message.senderId = this.character().id;
                    message.targetId = target.id;

                    const date = new Date();

                    message.time = `${ date.getHours() }:${ date.getMinutes() }`;
                    message.timeStamp = timeStamp;
                    message.offeredItem.push(
                        Object.assign(
                            new Item(),
                            JSON.parse(JSON.stringify(item))).recast(this._typeService, this.itemsService,
                        ),
                    );
                    message.itemAmount = amount;
                    message.includedItems = included.items;
                    message.includedInventories = included.inventories;

                    return this._messageService.send_Messages([message])
                        .pipe(
                            tap({
                                complete: () => {
                                    //If the message was sent, send a summary toast.
                                    this.toastService.show(`Sent item offer to <strong>${ target.name }</strong>.`);
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
                        this.toastService.show('An error occurred while sending item. See console for more information.');
                        console.error(`Error saving item message to database: ${ error.message }`);
                    }
                },
            });
    }

    public applyMessageItems(messages: Array<PlayerMessage>): void {
        //Don't receive messages in manual mode.
        if (this.isManualMode()) {
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
                    if (targetCreature instanceof Character || targetCreature instanceof AnimalCompanion) {
                        const targetInventory = targetCreature.inventories[0];
                        let addedPrimaryItem: Item;

                        message.offeredItem.concat(message.includedItems).forEach(item => {
                            if (item === message.offeredItem[0]) {
                                item.amount = message.itemAmount;
                            }

                            const typedItem = this.itemsService.cast_ItemByType(item);
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

                                this.refreshService.set_ToChange(targetCreature.type, 'inventory');
                                this.refreshService.set_Changed(existingItems[0].id);
                            } else {
                                typedItem.recast(this._typeService, this.itemsService);

                                const newLength = targetInventory[typedItem.type].push(typedItem);
                                const addedItem = targetInventory[typedItem.type][newLength - 1];

                                this.refreshService.set_ToChange(targetCreature.type, 'inventory');

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
                            this.toastService.show(text);
                            //Build a response message that lets the other player know that the item has been accepted.
                            this.sendItemAcceptedMessage(message);
                        }
                    }
                }
            } else {
                //Build a response message that lets the other player know that the item has been rejected.
                this.sendItemAcceptedMessage(message, false);
            }

            this._messageService.mark_MessageAsIgnored(this, message);
        });
    }

    public sendItemAcceptedMessage(message: PlayerMessage, accepted = true): void {
        //Don't send messages in GM mode or manual mode, or if not logged in.
        if (this.isGMMode() || this.isManualMode() || !this.isLoggedIn()) {
            return;
        }

        this._messageService.get_Time()
            .pipe(
                switchMap(result => {
                    const timeStamp = result.time;
                    //Build a message to the correct player and creature, with the timestamp just received from the database connector.
                    const response = new PlayerMessage();

                    response.recipientId = message.senderId;
                    response.senderId = this.character().id;
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

                    return this._messageService.send_Messages([response])
                        .pipe(
                            tap({
                                complete: () => {
                                    //If the message was sent, send a summary toast.
                                    if (accepted) {
                                        this.toastService.show(`Sent acceptance response to <strong>${ target }</strong>.`);
                                    } else {
                                        this.toastService.show(`Sent rejection response to <strong>${ target }</strong>.`);
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
                        this.toastService.show('An error occurred while sending response. See console for more information.');
                        console.error(`Error saving response message to database: ${ error.message }`);
                    }
                },
            });
    }

    public applyItemAcceptedMessages(messages: Array<PlayerMessage>): void {
        //Don't receive messages in manual mode.
        if (this.isManualMode()) {
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
                    this.toastService.show(
                        `<strong>${ sender }</strong> has accepted the <strong>`
                        + `${ itemName }</strong>. The item is dropped from your inventory.`,
                    );

                    if (foundItem) {
                        this.dropInventoryItem(foundCreature, foundInventory, foundItem, false, true, true, message.itemAmount);
                    }
                } else if (message.rejectedItem) {
                    this.toastService.show(
                        `<strong>${ sender }</strong> has rejected the <strong>`
                        + `${ itemName }</strong>. The item will remain in your inventory.`,
                    );
                }
            }

            this._messageService.mark_MessageAsIgnored(this, message);
        });
        this.refreshService.process_ToChange();
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

        if (creature instanceof Character) {
            phrases.name = 'You';
            phrases.pronounCap = 'You';
            phrases.pronoun = 'you';
            phrases.pronounGenitive = 'your';
            phrases.verbIs = 'are';
            phrases.verbHas = 'have';
        } else if (creature instanceof AnimalCompanion) {
            phrases.name = this.companion().name || 'Your animal companion';
        } else if (creature instanceof Familiar) {
            phrases.name = this.familiar().name || 'Your familiar';
        }

        return phrases;
    }

    public changeCharacterFocusPointsWithNotification(value: number): void {
        const maxFocusPoints = this.maxFocusPoints();
        const character = this.character();

        if (maxFocusPoints === 0) {
            this.toastService.show('Your focus points were not changed because you don\'t have a focus pool.');

            return;
        }

        character.class.focusPoints = Math.min(character.class.focusPoints, maxFocusPoints);
        // We intentionally add the point after we set the limit.
        // This allows us to gain focus points with feats and raise the current points
        // before the limit is increased. The focus points are automatically limited in the spellbook component,
        // where they are displayed, and when casting focus spells.
        character.class.focusPoints += value;

        if (value >= 0) {
            this.toastService.show(`You gained ${ value } focus point${ value === 1 ? '' : 's' }.`);
        } else {
            this.toastService.show(`You lost ${ value * -1 } focus point${ value === 1 ? '' : 's' }.`);
        }

        this.refreshService.set_ToChange('Character', 'spellbook');
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
                this.toastService.show(`${ phrases.name } gained ${ value } temporary HP.`);
            } else if (creature.health.temporaryHP[0].amount === 0) {
                creature.health.temporaryHP[0] = { amount: value, source: context.source, sourceId: context.sourceId };
                creature.health.temporaryHP.length = 1;
                this.toastService.show(`${ phrases.name } gained ${ value } temporary HP from ${ context.source }.`);
            } else {
                creature.health.temporaryHP.push({ amount: value, source: context.source, sourceId: context.sourceId });
                this.toastService.show(
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

                    this.toastService.show(`${ phrases.name } lost ${ value * -1 } temporary HP.`);
                } else {
                    if (targetTempHPSet.amount <= 0) {
                        creature.health.temporaryHP.splice(creature.health.temporaryHP.indexOf(targetTempHPSet), 1);
                    }

                    this.toastService.show(
                        `${ phrases.name } lost ${ value * -1 } of the temporary HP gained from ${ context.source }. `
                        + `This is not the set of temporary HP that ${ phrases.pronoun } ${ phrases.verbIs } currently using.`,
                    );
                }
            }
        }

        this.refreshService.set_ToChange(creature.type, 'health');
        //Update Health and Time because having multiple temporary HP keeps you from ticking time and resting.
        this.refreshService.set_ToChange('Character', 'health');
        this.refreshService.set_ToChange('Character', 'time');
    }

    public changeCreatureHPWithNotification(creature: Creature, value: number, context: { source: string }): void {
        const phrases = this.effectRecipientPhrases(creature);

        if (value > 0) {
            const result = creature.health.heal(creature, this, this.effectsService, value, true);
            let results = '';

            if (result.hasRemovedUnconscious) {
                results = ` This removed ${ phrases.pronounGenitive } Unconscious condition.`;
            }

            if (result.hasRemovedDying) {
                results = ` This removed ${ phrases.pronounGenitive } Dying condition.`;
            }

            this.toastService.show(`${ phrases.name } gained ${ value } HP from ${ context.source }.${ results }`);
        } else if (value < 0) {
            const result = creature.health.takeDamage(creature, this, this.effectsService, -value, false);
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

            this.toastService.show(`${ phrases.name } lost ${ value * -1 } HP from ${ context.source }.${ results }`);
        }

        this.refreshService.set_ToChange(creature.type, 'health');
        this.refreshService.set_ToChange(creature.type, 'effects');
    }

    public raiseCharacterShieldWithNotification(value: number): void {
        const equippedShield = this.character().inventories[0].shields.find(shield => shield.equipped);

        if (equippedShield) {
            if (value > 0) {
                equippedShield.raised = true;
                this.toastService.show('Your shield was raised.');
            } else {
                equippedShield.raised = false;
                this.toastService.show('Your shield was lowered.');
            }

            this.refreshService.set_ToChange('Character', 'defense');
            this.refreshService.set_ToChange('Character', 'effects');
        }
    }

    public changeCreatureCoverWithNotification(creature: Creature, value: number): void {
        const phrases = this.effectRecipientPhrases(creature);

        this.defenseService.armorClass.setCover(creature, value, null, this, this.conditionsService);

        switch (value) {
            case CoverTypes.NoCover:
                this.toastService.show(`${ phrases.name } ${ phrases.verbIs } no longer taking cover.`);
                break;
            case CoverTypes.LesserCover:
                this.toastService.show(`${ phrases.name } now ${ phrases.verbHas } lesser cover.`);
                break;
            case CoverTypes.Cover:
                this.toastService.show(`${ phrases.name } now ${ phrases.verbHas } standard cover.`);
                break;
            case CoverTypes.GreaterCover:
                this.toastService.show(`${ phrases.name } now ${ phrases.verbHas } greater cover.`);
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
                    this._evaluationService.get_ValueFromFormula(
                        effectGain.value,
                        { characterService: this, effectsService: this.effectsService },
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

        if (creature instanceof Character) {
            phrases.name = 'You';
            phrases.pronounCap = 'You';
            phrases.pronoun = 'you';
            phrases.pronounGenitive = 'your';
            phrases.verbIs = 'are';
            phrases.verbHas = 'have';
        } else if (creature instanceof AnimalCompanion) {
            phrases.name = this.companion().name || 'Your animal companion';
        } else if (creature instanceof Familiar) {
            phrases.name = this.familiar().name || 'Your familiar';
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
        return this.abilitiesService.abilities(name);
    }

    public skills(
        creature: Creature,
        name = '',
        filter: { type?: string; locked?: boolean } = {},
        options: { noSubstitutions?: boolean } = {},
    ): Array<Skill> {
        return this.skillsService.get_Skills(creature.customSkills, name, filter, options);
    }

    public feats(name = '', type = ''): Array<Feat> {
        return this.featsService.get_Feats(this.character().customFeats, name, type);
    }

    public features(name = ''): Array<Feat> {
        return this.featsService.get_Features(name);
    }

    public featsAndFeatures(name = '', type = '', includeSubTypes = false, includeCountAs = false): Array<Feat> {
        //Use this function very sparingly! See get_All() for details.
        return this.featsService.get_All(this.character().customFeats, name, type, includeSubTypes, includeCountAs);
    }

    public characterFeatsAndFeatures(name = '', type = '', includeSubTypes = false, includeCountAs = false): Array<Feat> {
        return this.featsService.get_CharacterFeats(this.character().customFeats, name, type, includeSubTypes, includeCountAs);
    }

    public characterFeatsTaken(
        minLevelNumber = 0,
        maxLevelNumber = 0,
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
            return this.featsService.get_CharacterFeatsTaken(
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
            return this.character().takenFeats(
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
        return this.animalCompanionsService.companionLevels();
    }

    public creatureSenses(creature: Creature, charLevel: number = this.character().level, allowTemporary = false): Array<string> {
        let senses: Array<string> = [];

        let ancestrySenses: Array<string>;

        if (creature instanceof Familiar) {
            ancestrySenses = creature.senses;
        } else {
            ancestrySenses = (creature as AnimalCompanion | Character).class?.ancestry?.senses;
        }

        if (ancestrySenses.length) {
            senses.push(...ancestrySenses);
        }

        if (creature instanceof Character) {
            const heritageSenses = creature.class.heritage.senses;

            if (heritageSenses.length) {
                senses.push(...heritageSenses);
            }

            this.characterFeatsAndFeatures()
                .filter(feat => feat.senses?.length && feat.have({ creature }, { characterService: this }, { charLevel }))
                .forEach(feat => {
                    senses.push(...feat.senses);
                });
        }

        if (creature instanceof Familiar) {
            creature.abilities.feats
                .map(gain => this.familiarsService.get_FamiliarAbilities(gain.name)[0])
                .filter(ability => ability?.senses.length)
                .forEach(ability => {
                    senses.push(...ability.senses);
                });
        }

        if (allowTemporary) {
            senses.push(...this.sensesGrantedByEquipment(creature));
            this.currentCreatureConditions(creature).filter(gain => gain.apply)
                .forEach(gain => {
                    const condition = this.conditionsService.conditions(gain.name)[0];

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

    public processFeat(
        creature: Character | Familiar,
        feat: Feat,
        gain: FeatTaken,
        choice: FeatChoice,
        level: Level,
        taken: boolean,
    ): void {
        this.featsService.process_Feat(creature, this, feat, gain, choice, level, taken);
    }

    public characterFeatsShowingHintsOnThis(objectName = 'all'): Array<Feat> {
        return this.characterFeatsAndFeatures().filter(feat =>
            feat.hints.find(hint =>
                (hint.minLevel ? this.character().level >= hint.minLevel : true) &&
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
            ) && feat.have({ creature: this.character() }, { characterService: this }),
        );
    }

    public companionElementsShowingHintsOnThis(objectName = 'all'): Array<AnimalCompanionAncestry | AnimalCompanionSpecialization | Feat> {
        //Get showon elements from Companion Ancestry and Specialization
        return []
            .concat(
                [this.companion().class.ancestry]
                    .filter(ancestry =>
                        ancestry.hints
                            .find(hint =>
                                (hint.minLevel ? this.character().level >= hint.minLevel : true) &&
                                hint.showon?.split(',')
                                    .find(showon =>
                                        objectName === 'all' ||
                                        showon.trim().toLowerCase() === objectName.toLowerCase(),
                                    ),
                            ),
                    ),
            )
            .concat(
                this.companion().class.specializations
                    .filter(spec =>
                        spec.hints
                            .find(hint =>
                                (hint.minLevel ? this.character().level >= hint.minLevel : true) &&
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
        return this.familiarsService.get_FamiliarAbilities().filter(feat =>
            feat.hints.find(hint =>
                (hint.minLevel ? this.character().level >= hint.minLevel : true) &&
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
            ) && feat.have({ creature: this.familiar() }, { characterService: this }),
            //Return any feats that include e.g. Companion:Athletics
        )
            .concat(this.characterFeatsShowingHintsOnThis(`Familiar:${ objectName }`));
    }

    public creatureConditionsShowingHintsOnThis(creature: Creature, objectName = 'all'): Array<ConditionSet> {
        return this.currentCreatureConditions(creature)
            .filter(conditionGain => conditionGain.apply)
            .map(conditionGain =>
                Object.assign(new ConditionSet(), { gain: conditionGain, condition: this.conditions(conditionGain.name)[0] }),
            )
            .filter(conditionSet =>
                conditionSet.condition?.hints.find(hint =>
                    (hint.minLevel ? this.character().level >= hint.minLevel : true) &&
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

    public creatureOwnedActivities(creature: Creature, levelNumber: number = creature.level, all = false): Array<ActivityGain> {
        const activities: Array<ActivityGain | ItemActivity> = [];

        if (!this.stillLoading) {
            if (creature instanceof Character) {
                activities.push(...creature.class.activities.filter(gain => gain.level <= levelNumber));
            }

            if (creature instanceof AnimalCompanion) {
                activities.push(...creature.class?.ancestry?.activities.filter(gain => gain.level <= levelNumber) || []);
            }

            // Get all applied condition gains' activity gains. These were copied from the condition when it was added.
            // Also set the condition gain's spell level to the activity gain.
            this.currentCreatureConditions(creature, '', '', true).filter(gain => gain.apply)
                .forEach(gain => {
                    gain.gainActivities.forEach(activityGain => {
                        activityGain.heightened = gain.heightened;
                    });
                    activities.push(...gain.gainActivities);
                });

            //With the all parameter, get all activities of all items regardless of whether they are equipped or invested or slotted.
            // This is used for ticking down cooldowns.
            if (all) {
                creature.inventories.forEach(inv => {
                    inv.allEquipment().forEach(item => {
                        //Get external activity gains from items.
                        if (item.gainActivities.length) {
                            if (item instanceof Shield && item.emblazonArmament?.length) {
                                //Only get Emblazon Armament activities if the blessing applies.
                                activities.push(...item.gainActivities.filter(gain =>
                                    (item.$emblazonEnergy ? true : gain.source !== 'Emblazon Energy') &&
                                    (item.$emblazonAntimagic ? true : gain.source !== 'Emblazon Antimagic'),
                                ));
                            } else {
                                activities.push(...item.gainActivities);
                            }
                        }

                        if (item.activities.length) {
                            activities.push(...item.activities);
                        }

                        //Get activities from runes.
                        if (item.propertyRunes) {
                            item.propertyRunes.filter(rune => rune.activities.length).forEach(rune => {
                                activities.push(...rune.activities);
                            });
                        }

                        //Get activities from runes.
                        if (item.bladeAllyRunes) {
                            item.bladeAllyRunes.filter(rune => rune.activities.length).forEach(rune => {
                                activities.push(...rune.activities);
                            });
                        }

                        //Get activities from Oils emulating runes.
                        if (item.oilsApplied) {
                            item.oilsApplied.filter(oil => oil.runeEffect && oil.runeEffect.activities).forEach(oil => {
                                activities.push(...oil.runeEffect.activities);
                            });
                        }

                        //Get activities from slotted Aeon Stones.
                        if ((item as WornItem).aeonStones) {
                            (item as WornItem).aeonStones.filter(stone => stone.activities.length).forEach(stone => {
                                activities.push(...stone.activities);
                            });
                        }

                        item.traits
                            .map(trait => this.traitsService.getTraits(trait)[0])
                            .filter(trait => trait?.gainActivities.length)
                            .forEach(trait => {
                                activities.push(...trait.gainActivities);
                            });
                    });
                    inv.allRunes().forEach(rune => {
                        if (rune.activities.length) {
                            activities.push(...rune.activities);
                        }
                    });
                });
            } else {
                //Without the all parameter, get activities only from equipped and invested items and their slotted items.
                const hasTooManyAeonStonesSlotted = this.itemsService.get_TooManySlottedAeonStones(creature);

                creature.inventories[0]?.allEquipment()
                    .filter(item =>
                        item.investedOrEquipped() &&
                        !item.broken,
                    )
                    .forEach((item: Equipment) => {
                        if (item.gainActivities.length) {
                            activities.push(...item.gainActivities);
                        }

                        //DO NOT get resonant activities at this point; they are only available if the item is slotted into a wayfinder.
                        if (item.activities.length) {
                            activities.push(...item.activities.filter(activity => !activity.resonant || all));
                        }

                        //Get activities from runes.
                        if (item.propertyRunes) {
                            item.propertyRunes.filter(rune => rune.activities.length).forEach(rune => {
                                activities.push(...rune.activities);
                            });
                        }

                        //Get activities from blade ally runes.
                        if ((item instanceof Weapon || item instanceof WornItem) && item.bladeAllyRunes && item.bladeAlly) {
                            item.bladeAllyRunes.filter(rune => rune.activities.length).forEach(rune => {
                                activities.push(...rune.activities);
                            });
                        }

                        //Get activities from oils emulating runes.
                        if (item.oilsApplied) {
                            item.oilsApplied.filter(oil => oil.runeEffect && oil.runeEffect.activities).forEach(oil => {
                                activities.push(...oil.runeEffect.activities);
                            });
                        }

                        //Get activities from slotted aeon stones, NOW including resonant activities.
                        if (!hasTooManyAeonStonesSlotted && item instanceof WornItem) {
                            item.aeonStones.filter(stone => stone.activities.length).forEach(stone => {
                                activities.push(...stone.activities);
                            });
                        }

                        item.traits
                            .map(trait => this.traitsService.getTraits(trait)[0])
                            .filter(trait => trait?.gainActivities.length)
                            .forEach(trait => {
                                activities.push(...trait.gainActivities);
                            });
                    });
            }
        }

        return activities
            .sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public creatureActivitiesShowingHintsOnThis(creature: Creature, objectName = 'all'): Array<Activity> {
        return this.creatureOwnedActivities(creature)
            //Conflate ActivityGains and their respective Activities into one object...
            .map(gain => ({ gain, activity: gain.originalActivity(this.activitiesService) }))
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

        const hasTooManyAeonStonesSlotted = this.itemsService.get_TooManySlottedAeonStones(creature);

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

                    if (!hasTooManyAeonStonesSlotted && item instanceof WornItem) {
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
        if (creature instanceof Character) {
            return creature.inventories[0].armors.find(armor => armor.equipped).armorSpecializations(creature, this)
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
                );
        } else {
            return [];
        }
    }

    public maxFocusPoints(): number {
        let focusPoints = 0;

        this.effectsService.get_AbsolutesOnThis(this.character(), 'Focus Pool').forEach(effect => {
            focusPoints = parseInt(effect.setValue, 10);
        });
        this.effectsService.get_RelativesOnThis(this.character(), 'Focus Pool').forEach(effect => {
            focusPoints += parseInt(effect.value, 10);
        });

        return Math.min(focusPoints, Defaults.maxFocusPoints);
    }

    public ACObject(): AC {
        return this.defenseService.armorClass;
    }

    public isMobileView(): boolean {
        return (window.innerWidth < Defaults.mobileBreakpointPx);
    }

    public prepareViewChangeByEffectTargets(creature: Creature, targets: Array<string>): void {
        this.refreshService.set_ToChangeByEffectTargets(targets, { creature });
    }

    public initializeAnimalCompanion(): void {
        const character = this.character();

        this.cacheService.resetCreatureCache(1);

        if (character.class.animalCompanion) {
            character.class.animalCompanion =
                Object.assign(new AnimalCompanion(), character.class.animalCompanion).recast(this._typeService, this.itemsService);
            character.class.animalCompanion.class.levels = this.animalCompanionLevels();
            this._equipBasicItems(character.class.animalCompanion);
            character.class.animalCompanion.setLevel(this);
        }
    }

    public initializeFamiliar(): void {
        const character = this.character();

        this.cacheService.resetCreatureCache(CreatureTypeIds.Familiar);

        if (character.class.familiar) {
            character.class.familiar = Object.assign(new Familiar(), character.class.familiar).recast(this._typeService, this.itemsService);
            this.refreshService.set_ToChange('Familiar', 'all');
        }
    }

    public removeAllFamiliarAbilities(): void {
        const familiar = this.familiar();
        const abilityNames = familiar.abilities.feats.map(gain => gain.name);

        abilityNames.forEach(abilityName => {
            this.character().takeFeat(familiar, this, undefined, abilityName, false, familiar.abilities, undefined);
        });
    }

    public initialize(): void {
        this._loading = true;
        this.setLoadingStatus('Loading extensions');

        const waitForFileServices = setInterval(() => {
            if (!this._extensionsService.still_loading() && !this._configService.stillLoading) {
                clearInterval(waitForFileServices);
                this.setLoadingStatus('Initializing content');
                this._character = new Character();
            }
        }, Defaults.waitForServiceDelay);
    }

    public reset(id?: string, loadAsGM?: boolean): void {
        this._loading = true;
        this.cacheService.reset();
        this.traitsService.reset();
        this.activitiesService.reset();
        this.featsService.reset();
        this.conditionsService.reset();
        this.skillsService.reset();
        this.itemsService.reset();
        this.deitiesService.reset();
        this.animalCompanionsService.reset();
        this.familiarsService.reset();
        this._messageService.reset();

        if (id) {
            this.setLoadingStatus('Loading character');
            this._savegameService.loadCharacter(id)
                .subscribe({
                    next: (results: Array<Partial<Character>>) => {
                        this._loader = results;

                        if (this._loader) {
                            this.finishLoading(loadAsGM);
                        } else {
                            this.toastService.show('The character could not be found in the database.');
                            this._cancelLoading();
                        }
                    },
                    error: error => {
                        if (error.status === HttpStatusCode.Unauthorized) {
                            this._configService.logout(
                                'Your login is no longer valid. The character could not be loaded. Please try again after logging in.',
                            );
                            this._cancelLoading();
                        } else {
                            this.toastService.show('An error occurred while loading the character. See console for more information.');
                            console.error(`Error loading character from database: ${ error.message }`);
                            this._cancelLoading();
                        }
                    },
                });
        } else {
            this._character = new Character();
            this.finishLoading();
        }
    }

    public deleteCharacter(savegame: Savegame): void {
        this._savegameService.deleteCharacter(savegame)
            .subscribe({
                next: () => {
                    this.toastService.show(`Deleted ${ savegame.name || 'character' } from database.`);
                    this._savegameService.reset();
                },
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._configService.logout(
                            'Your login is no longer valid. The character could not be deleted. Please try again after logging in.',
                        );
                    } else {
                        this.toastService.show('An error occurred while deleting the character. See console for more information.');
                        console.error(`Error deleting from database: ${ error.message }`);
                    }
                },
            });
    }

    public finishLoading(loadAsGM = false): void {
        this.setLoadingStatus('Initializing character');
        //Assign and restore the loaded character.
        this._character =
            this._savegameService.processLoadedCharacter(
                JSON.parse(JSON.stringify(this._loader)),
                this,
                this.itemsService,
                this.classesService,
                this._historyService,
                this.animalCompanionsService,
            );
        this._character.GMMode = loadAsGM;
        this._loader = [];
        // Set loading to false. The last steps need the characterService to not be loading.
        this._loading = false;
        // Set your turn state according to the saved state.
        this.timeService.setYourTurn(this.character().yourTurn);
        // Fill a runtime variable with all the feats the character has taken, and another with the level at which they were taken.
        this.featsService.build_CharacterFeats(this.character());
        // Reset cache for all creatures.
        this.cacheService.reset();
        // Set accent color and dark mode according to the settings.
        this.setAccent();
        this.setDarkmode();
        // Now that the character is loaded, do some things that require everything to be in working order:
        // Give the character a Fist and an Unarmored™ if they have nothing else,
        // and keep those ready if they should drop their last weapon or armor.
        this._grantBasicItems();
        this._refreshAfterLoading();
    }

    public saveCharacter(): void {
        this.character().yourTurn = this.timeService.getYourTurn();
        this.toastService.show('Saving...');

        const savegame =
            this._savegameService.prepareCharacterForSaving(
                this.character(),
                this.itemsService,
                this.classesService,
                this._historyService,
                this.animalCompanionsService,
            );

        this._savegameService.saveCharacter(savegame)
            .subscribe({
                next: result => {
                    if (result.lastErrorObject && result.lastErrorObject.updatedExisting) {
                        this.toastService.show(`Saved ${ this.character().name || 'character' }.`);
                    } else {
                        this.toastService.show(`Created ${ this.character().name || 'character' }.`);
                    }

                    this._savegameService.reset();
                }, error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._configService.logout(
                            'Your login is no longer valid. The character could not be saved. '
                            + 'Please try saving the character again after logging in.',
                        );
                    } else {
                        this.toastService.show('An error occurred while saving the character. See console for more information.');
                        console.error(`Error saving to database: ${ error.message }`);
                    }
                },
            });
    }

    private _cancelLoading(): void {
        this._loader = [];
        this._loading = false;
        // Fill a runtime variable with all the feats the character has taken,
        // and another with the level at which they were taken. These were cleared when trying to load.
        this.featsService.build_CharacterFeats(this.character());
        this._refreshAfterLoading();
    }

    private _refreshAfterLoading(): void {
        //Update everything once, then effects, and then the player can take over.
        this.refreshService.set_Changed();
        this.setLoadingStatus('Loading', false);
        this.refreshService.set_ToChange('Character', 'effects');

        if (!this._configService.isLoggedIn && !this._configService.cannotLogin) {
            this.refreshService.set_ToChange('Character', 'logged-out');
        }

        this.refreshService.process_ToChange();
    }

    private _rgbAccent(): string {
        const rgbLength = 4;
        const rrggbbLength = 7;
        const redIndex = 0;
        const greenIndex = 1;
        const blueIndex = 2;

        const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
            let result: RegExpExecArray;

            if (hex.length === rgbLength) {
                result = /^#?([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$/i.exec(hex);

                return result ? {
                    r: parseInt(`${ result[redIndex] }${ result[redIndex] }`, 16),
                    g: parseInt(`${ result[greenIndex] }${ result[greenIndex] }`, 16),
                    b: parseInt(`${ result[blueIndex] }${ result[blueIndex] }`, 16),
                } : null;
            } else if (hex.length === rrggbbLength) {
                result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

                return result ? {
                    r: parseInt(result[redIndex], 16),
                    g: parseInt(result[greenIndex], 16),
                    b: parseInt(result[blueIndex], 16),
                } : null;
            }
        };

        if (!this.stillLoading) {
            const original = this.character().settings.accent;

            if (original.length === rgbLength || original.length === rrggbbLength) {
                try {
                    const rgba = hexToRgb(original);

                    if (rgba) {
                        return `${ rgba.r }, ${ rgba.g }, ${ rgba.b }`;
                    }
                } catch (error) {
                    return Defaults.colorAccentRGB;
                }
            }
        }

        return Defaults.colorAccentRGB;
    }

    private _markUnneededWeaponFeatsForDeletion(weapon: Weapon): void {
        //If there are no weapons left of this name in any inventory, find any custom feat that has it as its subType.
        //These feats are not useful anymore, but the player may wish to keep them.
        //They are marked with canDelete, and the player can decide whether to delete them.
        const character = this.character();
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
                        this.itemsService
                            .move_InventoryItemLocally(creature, invItem, creature.inventories[0], inv, this, invItem.amount, true);
                    }
                });
        });

        if (found) {
            this.toastService.show(
                `${ found } item${ found > 1 ? 's' : '' } were emptied out of <strong>${ item.effectiveName() }</strong> `
                + 'before dropping the item. These items can be found in your inventory, unless they were dropped in the same process.',
            );
        }
    }

    private _grantBasicItems(): void {
        //This function depends on the items being loaded, and it will wait forever for them!
        const waitForItemsService = setInterval(() => {
            if (!this._extensionsService.still_loading() && !this._configService.stillLoading) {
                clearInterval(waitForItemsService);

                const newBasicWeapon: Weapon =
                    Object.assign(
                        new Weapon(),
                        this.itemsService.get_CleanItemByID('08693211-8daa-11ea-abca-ffb46fbada73'),
                    ).recast(this._typeService, this.itemsService);
                const newBasicArmor: Armor =
                    Object.assign(
                        new Armor(),
                        this.itemsService.get_CleanItemByID('89c1a2c2-8e09-11ea-9fab-e92c63c14723'),
                    ).recast(this._typeService, this.itemsService);

                this._basicItems = { weapon: newBasicWeapon, armor: newBasicArmor };
                this._equipBasicItems(this.character(), false);
                this._equipBasicItems(this.companion(), false);
            }
        }, Defaults.waitForServiceDelay);
    }

    private _equipBasicItems(creature: Creature, changeAfter = true): void {
        if (!this.stillLoading && this._basicItems.weapon && this._basicItems.armor && !(creature instanceof Familiar)) {
            if (!creature.inventories[0].weapons.some(weapon => !weapon.broken) && (creature instanceof Character)) {
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
