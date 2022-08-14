/* eslint-disable max-lines */
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { Class } from 'src/app/classes/Class';
import { ClassLevel } from 'src/app/classes/ClassLevel';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { FeatsService } from 'src/app/services/feats.service';
import { HistoryDataService } from 'src/app/core/services/data/history-data.service';
import { Ancestry } from 'src/app/classes/Ancestry';
import { Heritage } from 'src/app/classes/Heritage';
import { Background } from 'src/app/classes/Background';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { Ability } from 'src/app/classes/Ability';
import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { Deity } from 'src/app/classes/Deity';
import { DeitiesDataService } from 'src/app/core/services/data/deities-data.service';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { AnimalCompanionsDataService } from 'src/app/core/services/data/animal-companions-data.service';
import { AnimalCompanionClass } from 'src/app/classes/AnimalCompanionClass';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { Familiar } from 'src/app/classes/Familiar';
import { SavegamesService } from 'src/libs/shared/saving-loading/services/savegames/savegames.service';
import { Savegame } from 'src/app/classes/Savegame';
import { TraitsDataService } from 'src/app/core/services/data/traits-data.service';
import { FamiliarsDataService } from 'src/app/core/services/data/familiars-data.service';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { Spell } from 'src/app/classes/Spell';
import { Character } from 'src/app/classes/Character';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { Activity } from 'src/app/classes/Activity';
import { Domain } from 'src/app/classes/Domain';
import { ConfigService } from 'src/app/core/services/config/config.service';
import { default as package_json } from 'package.json';
import { FeatData } from 'src/app/character-creation/definitions/models/FeatData';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CacheService } from 'src/app/services/cache.service';
import { Subscription } from 'rxjs';
import { HeritageGain } from 'src/app/classes/HeritageGain';
import { InputValidationService } from 'src/libs/shared/input-validation/input-validation.service';
import { DisplayService } from 'src/app/core/services/display/display.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { MenuState } from 'src/libs/shared/definitions/Types/menuState';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { Alignments } from 'src/libs/shared/definitions/alignments';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { Trait } from 'src/app/classes/Trait';
import { AbilityBoost } from 'src/app/classes/AbilityBoost';
import { SkillIncrease } from 'src/app/classes/SkillIncrease';
import { Skill } from 'src/app/classes/Skill';
import { CreatureSizeName } from 'src/libs/shared/util/creatureUtils';
import { AbilityModFromAbilityValue } from 'src/libs/shared/util/abilityUtils';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { FeatTaken } from 'src/app/character-creation/definitions/models/FeatTaken';
import { Weapon } from 'src/app/classes/Weapon';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { AnimalCompanionAncestryService } from 'src/libs/shared/services/animal-companion-ancestry/animal-companion-ancestry.service';
import { AnimalCompanionSpecializationsService } from 'src/libs/shared/services/animal-companion-specializations/animal-companion-specializations.service';
import { AnimalCompanionLevelsService } from 'src/libs/shared/services/animal-companion-level/animal-companion-level.service';
import { CharacterClassChangeService } from 'src/app/character-creation/services/character-class-change/character-class-change.service';
import { CharacterAncestryChangeService } from 'src/app/character-creation/services/character-ancestry-change/character-ancestry-change.service';
import { CharacterHeritageChangeService } from 'src/app/character-creation/services/character-heritage-change/character-heritage-change.service';
import { CharacterBackgroundChangeService } from 'src/app/character-creation/services/character-background-change/character-background-change.service';
import { CharacterBoostAbilityService } from 'src/app/character-creation/services/character-boost-ability/character-boost-ability.service';
import { SpellsTakenService } from 'src/libs/shared/services/spells-taken/spells-taken.service';
import { EquipmentSpellsService } from 'src/libs/shared/services/equipment-spells/equipment-spells.service';
import { CharacterLoreService } from 'src/libs/shared/services/character-lore/character-lore.service';
import { ConditionsDataService } from 'src/app/core/services/data/conditions-data.service';
import { SpellsDataService } from 'src/app/core/services/data/spells-data.service';
import { ClassesDataService } from 'src/app/core/services/data/classes-data.service';
import { CharacterDeitiesService } from 'src/libs/shared/services/character-deities/character-deities.service';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';
import { CharacterDeletingService } from 'src/libs/shared/saving-loading/services/character-deleting/character-deleting.service';
import { CharacterSavingService } from 'src/libs/shared/saving-loading/services/character-saving/character-saving.service';
import { CharacterLoadingService } from 'src/libs/shared/saving-loading/services/character-loading/character-loading.service';
import { DocumentStyleService } from 'src/app/core/services/document-style/document-style.service';

type ShowContent = FeatChoice | SkillChoice | AbilityChoice | LoreChoice | { id: string; source?: string };

@Component({
    selector: 'app-character',
    templateUrl: './character.component.html',
    styleUrls: ['./character.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterComponent implements OnInit, OnDestroy {

    public newClass: Class = new Class();
    public adventureBackgrounds = true;
    public regionalBackgrounds = true;
    public deityWordFilter = '';
    public loadAsGM = false;
    public blankCharacter: Character = new Character();
    public bonusSource = 'Bonus';
    public versionString: string = package_json.version;
    public creatureTypesEnum = CreatureTypes;

    private _showLevel = 0;
    private _showItem = '';
    private _showList = '';
    private _showLevelFilter = false;
    private _showContent: ShowContent = null;
    private _showContentLevelNumber = 0;
    private _showFixedChangesLevelNumber = 0;

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _configService: ConfigService,
        private readonly _classesDataService: ClassesDataService,
        private readonly _abilitiesDataService: AbilitiesDataService,
        private readonly _featsService: FeatsService,
        private readonly _historyDataService: HistoryDataService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _deitiesDataService: DeitiesDataService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _animalCompanionsDataService: AnimalCompanionsDataService,
        private readonly _animalCompanionAncestryService: AnimalCompanionAncestryService,
        private readonly _animalCompanionSpecializationsService: AnimalCompanionSpecializationsService,
        private readonly _animalCompanionLevelsService: AnimalCompanionLevelsService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _savegamesService: SavegamesService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _familiarsDataService: FamiliarsDataService,
        private readonly _cacheService: CacheService,
        private readonly _modalService: NgbModal,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _characterClassChangeService: CharacterClassChangeService,
        private readonly _characterAncestryChangeService: CharacterAncestryChangeService,
        private readonly _characterHeritageChangeService: CharacterHeritageChangeService,
        private readonly _characterBackgroundChangeService: CharacterBackgroundChangeService,
        private readonly _characterBoostAbilityService: CharacterBoostAbilityService,
        private readonly _spellsTakenService: SpellsTakenService,
        private readonly _equipmentSpellsService: EquipmentSpellsService,
        private readonly _characterLoreService: CharacterLoreService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        private readonly _characterDeletingService: CharacterDeletingService,
        private readonly _characterSavingService: CharacterSavingService,
        private readonly _characterLoadingService: CharacterLoadingService,
        private readonly _documentStyleService: DocumentStyleService,
        public modal: NgbActiveModal,
        public trackers: Trackers,
    ) { }

    public get isMinimized(): boolean {
        return this._characterService.character.settings.characterMinimized;
    }

    public get isMobile(): boolean {
        return DisplayService.isMobile;
    }

    public get isGMMode(): boolean {
        return this._characterService.isGMMode;
    }

    public get isTileMode(): boolean {
        return this.character.settings.characterTileMode;
    }

    public get stillLoading(): boolean {
        return this._characterService.stillLoading;
    }

    public get areSavegamesInitializing(): boolean {
        return this._savegamesService.stillLoading;
    }

    public get isLoggingIn(): boolean {
        return this._configService.isLoggingIn;
    }

    public get hasDBConnectionURL(): boolean {
        return this._configService.hasDBConnectionURL;
    }

    public get isLoggedIn(): boolean {
        return this._configService.isLoggedIn;
    }

    public get cannotLogin(): boolean {
        return this._configService.cannotLogin;
    }

    public get character(): Character {
        return this._characterService.character;
    }

    public get companion(): AnimalCompanion {
        return this._characterService.character.class.animalCompanion;
    }

    public get familiar(): Familiar {
        return this._characterService.character.class.familiar;
    }

    public minimize(): void {
        this._characterService.character.settings.characterMinimized = !this._characterService.character.settings.characterMinimized;
    }

    public toggleCharacterMenu(): void {
        this._characterService.toggleMenu(MenuNames.CharacterMenu);
    }

    public characterMenuState(): MenuState {
        return this._characterService.characterMenuState();
    }

    public wasCharacterLoadedOrCreated(): boolean {
        return this._characterService.wasCharacterLoadedOrCreated();
    }

    public toggleShownLevel(levelNumber: number = 0): void {
        this._showLevel = this._showLevel === levelNumber ? 0 : levelNumber;
    }

    public toggleShownItem(name: string = ''): void {
        this._showItem = this._showItem === name ? '' : name;
    }

    public toggleShownList(name: string = '', levelNumber = 0, content: ShowContent = null): void {
        // Set the currently shown list name, level number and content so that the correct choice
        // with the correct data can be shown in the choice area.
        if (
            this._showList === name &&
            (!levelNumber || this._showContentLevelNumber === levelNumber) &&
            (!content || JSON.stringify(this._showContent) === JSON.stringify(content))
        ) {
            this._showList = '';
            this._showContentLevelNumber = 0;
            this._showContent = null;
        } else {
            this._showList = name;
            this._showContentLevelNumber = levelNumber;
            this._showContent = content;
            this._resetChoiceArea();
        }
    }

    public toggleLevelFilter(): void {
        this._showLevelFilter = !this._showLevelFilter;
    }

    public receiveChoiceMessage(message: { name: string; levelNumber: number; choice: SkillChoice | FeatChoice }): void {
        this.toggleShownList(message.name, message.levelNumber, message.choice);
    }

    public receiveFeatMessage(name: string): void {
        this.toggleShownItem(name);
    }

    public shownLevel(): number {
        return this._showLevel;
    }

    public shownItem(): string {
        return this._showItem;
    }

    public shownList(): string {
        return this._showList;
    }

    public isLevelFilterShown(): boolean {
        return this._showLevelFilter;
    }

    public activeChoiceContent(choiceType = ''): { name: string; levelNumber: number; choice: ShowContent } {
        // For choices that have a class of their own (AbilityChoice, SkillChoice, FeatChoice),
        // get the currently shown content with levelNumber if it is of that same class.
        // Also get the currently shown list name for compatibility.
        if (this._showContent?.constructor.name === choiceType) {
            return { name: this.shownList(), levelNumber: this.shownContentLevelNumber(), choice: this.shownContent() };
        }

        return null;
    }

    public activeAbilityChoiceContent(): { name: string; levelNumber: number; choice: AbilityChoice } {
        return this.activeChoiceContent('AbilityChoice') as { name: string; levelNumber: number; choice: AbilityChoice };
    }

    public activeSkillChoiceContent(): { name: string; levelNumber: number; choice: SkillChoice } {
        return this.activeChoiceContent('SkillChoice') as { name: string; levelNumber: number; choice: SkillChoice };
    }

    public activeFeatChoiceContent(): { name: string; levelNumber: number; choice: FeatChoice } {
        return this.activeChoiceContent('FeatChoice') as { name: string; levelNumber: number; choice: FeatChoice };
    }

    public activeLoreChoiceContent(): { name: string; levelNumber: number; choice: LoreChoice } {
        return this.activeChoiceContent('LoreChoice') as { name: string; levelNumber: number; choice: LoreChoice };
    }

    public activeSpecialChoiceShown(choiceType = ''): { name: string; levelNumber: number; choice: ShowContent } {
        if (this.shownList() === choiceType) {
            // For choices that don't have a class and can only show up once per level,
            // get the currently shown list name with levelNumber if the list name matches the choice type.
            // Also get a "choice" object with a unique ID (the list name and the level number)
            // for compatibility with TrackByID(), unless there is a current content with an id property.
            const shownContent = this.shownContent();

            return {
                name: choiceType,
                levelNumber: this.shownContentLevelNumber(),
                choice:
                    shownContent?.id
                        ? shownContent
                        : { id: choiceType + this.shownContentLevelNumber().toString() },
            };
        }
    }

    public shownContent(): ShowContent {
        return this._showContent;
    }

    public shownContentLevelNumber(): number {
        return this._showContentLevelNumber;
    }

    public toggleFixedChangesLevelNumber(levelNumber: number): void {
        this._showFixedChangesLevelNumber = this._showFixedChangesLevelNumber === levelNumber ? 0 : levelNumber;
    }

    public shownFixedChangesLevelNumber(): number {
        return this._showFixedChangesLevelNumber;
    }

    public onChangeAccent(): void {
        this._documentStyleService.setAccent();
    }

    public onToggleDarkmode(): void {
        this._documentStyleService.setDarkmode();
    }

    public onToggleManualMode(): void {
        //Manual mode changes some buttons on some components, so we need to refresh these.
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'activities');
        this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'activities');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'health');
        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'health');
        this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'health');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'inventory');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
        this._refreshService.processPreparedChanges();
    }

    public toggleTileMode(): void {
        this.character.settings.characterTileMode = !this.character.settings.characterTileMode;
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'skillchoices');
        this._refreshService.processPreparedChanges();
    }

    public onNewCharacter(): void {
        // The app starts with a character loaded, but not displayed.
        // The first time you click New Character, the loaded character is just displayed.
        // Every subsequent time, a new character is created.
        if (this.wasCharacterLoadedOrCreated()) {
            this.toggleShownList();
            this._characterLoadingService.loadOrResetCharacter();
        } else {
            this._characterService.setCharacterLoadedOrCreated();
        }
    }

    public onRetryDatabaseConnection(): void {
        this._savegamesService.reset();
    }

    public onRetryLogin(): void {
        this._configService.login('');
    }

    public savegames(): Array<Savegame> {
        if (!this._savegamesService.loadingError()) {
            return this._savegamesService.savegames()
                .sort((a, b) => {
                    if (a.partyName !== 'No Party' && b.partyName === 'No Party') {
                        return 1;
                    }

                    if (a.partyName === 'No Party' && b.partyName !== 'No Party') {
                        return -1;
                    }

                    return SortAlphaNum(a.partyName + a.name, b.partyName + b.name);
                });
        } else {
            return null;
        }
    }

    public savegameTitle(savegame: Savegame): string {
        let title = '';

        if (savegame.heritage) {
            title += ` | ${ savegame.heritage }`;

            if (savegame.ancestry) {
                if (!savegame.heritage.includes(savegame.ancestry)) {
                    title += ` ${ savegame.ancestry }`;
                }
            }
        } else {
            if (savegame.ancestry) {
                title += ` | ${ savegame.ancestry }`;
            }
        }

        if (savegame.class) {
            title += ' | ';

            if (savegame.classChoice) {
                title += `${ savegame.classChoice } `;
            }

            if (!savegame.classChoice?.includes(savegame.class)) {
                title += savegame.class;
            }
        }

        return title;
    }

    public partyNames(): Array<string> {
        return Array.from(new Set(this.savegames().map(savegame => savegame.partyName)));
    }

    public loadCharacterFromDB(savegame: Savegame): void {
        this._characterService.setCharacterLoadedOrCreated();
        this.toggleCharacterMenu();
        this._characterLoadingService.loadOrResetCharacter(savegame.id, this.loadAsGM);
    }

    public saveCharacterToDB(): void {
        this._characterSavingService.saveCharacter();
    }

    public openCharacterDeleteModal(content, savegame: Savegame): void {
        this._modalService.open(content, { centered: true, ariaLabelledBy: 'modal-title' }).result.then(result => {
            if (result === 'Ok click') {
                this._deleteCharacterFromDB(savegame);
            }
        });
    }

    public closeButtonTitle(): string {
        if (this._isFirstLoad()) {
            return 'Go to Character Sheet';
        } else {
            return 'Back to Character Sheet';
        }
    }

    public isBlankCharacter(): boolean {
        return this._characterService.isBlankCharacter();
    }

    public alignments(): Array<string> {
        const deity: Deity = this.character.class?.deity ? this._deitiesDataService.deities(this.character.class.deity)[0] : null;
        const alignments = [
            '',
            ...Object.values(Alignments),
        ];

        //Certain classes need to pick an alignment matching their deity
        if (deity && this.character.class.deityFocused) {
            return alignments.filter(alignment =>
                !deity.followerAlignments ||
                deity.followerAlignments.includes(alignment) ||
                alignment === '',
            );
        } else {
            return alignments;
        }

    }

    public classLevelByNumber(number: number): ClassLevel {
        return this.character.class.levels[number];
    }

    public onBaseValueChange(): void {
        const baseValues = this.character.baseValues;

        if (baseValues.length) {
            baseValues.length = 0;
        } else {
            this.abilities().forEach(ability => {
                baseValues.push({ name: ability.name, baseValue: Defaults.abilityBaseValue });
            });

            // Remove all Level 1 ability boosts that are now illegal
            if (this.character.class.name) {
                this.character.class.levels[1].abilityChoices.filter(choice => choice.available).forEach(choice => {
                    choice.boosts.length = Math.min(choice.available - choice.baseValuesLost, choice.boosts.length);
                });
            }
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'abilities');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'individualskills', 'all');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        this._refreshService.processPreparedChanges();
    }

    public onAbilityChange(name: string): void {
        this._refreshService.prepareChangesByAbility(CreatureTypes.Character, name);
    }

    public setComponentChanged(target = ''): void {
        this._refreshService.setComponentChanged(target);
    }

    public onLanguageChange(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        this._refreshService.processPreparedChanges();
    }

    public onNameChange(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
        this._refreshService.processPreparedChanges();
    }

    public onAlignmentChange(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public onHiddenFeatsChange(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
        this._refreshService.processPreparedChanges();
    }

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsDataService.traitFromName(traitName);
    }

    public onLevelUp(): void {
        const character = this.character;
        const oldLevel = character.level;

        character.level += 1;
        character.experiencePoints -= Defaults.expPerLevel;
        this.onLevelChange(oldLevel);
    }

    public onLevelChange(oldLevel: number): void {
        const character = this.character;
        const newLevel = character.level;

        // If we went up levels, prepare to repeat any onceEffects of Feats that apply inbetween,
        // such as recovering Focus Points for a larger Focus Pool.
        if (newLevel > oldLevel) {
            this.characterFeatsAndFeatures()
                .filter(feat =>
                    feat.onceEffects.length &&
                    this._featsService.have(
                        feat,
                        { creature: character },
                        { charLevel: newLevel, minLevel: (oldLevel + 1) },
                        { excludeTemporary: true },
                    ),
                )
                .forEach(feat => {
                    feat.onceEffects.forEach(effect => {
                        this._characterService.prepareOnceEffect(character, effect);
                    });
                });
        }

        //Find all the differences between the levels and refresh components accordingly.
        const lowerLevel = Math.min(oldLevel, newLevel);
        const higherLevel = Math.max(oldLevel, newLevel);

        character.class.levels.filter(level => level.number >= lowerLevel && level.number <= higherLevel).forEach(level => {
            level.featChoices.forEach(choice => {
                if (choice.showOnSheet) {
                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
                }
            });
        });
        character.class.levels.forEach(level => {
            level.featChoices.forEach(choice => {
                if (choice.showOnCurrentLevel) {
                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
                }

                choice.feats.forEach(taken => {
                    this._cacheService.setFeatChanged(taken.name, { creatureTypeId: 0, minLevel: lowerLevel, maxLevel: higherLevel });
                });
            });
        });
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'character-sheet');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'health');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'defense');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'individualspells', 'all');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
        character.abilityBoosts(lowerLevel, higherLevel).forEach(boost => {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'abilities');
            this._cacheService.setAbilityChanged(boost.name, { creatureTypeId: 0, minLevel: lowerLevel });
        });
        character.skillIncreases(lowerLevel, higherLevel).forEach(increase => {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'skillchoices');
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'individualSkills', increase.name);
            this._cacheService.setSkillChanged(increase.name, { creatureTypeId: 0, minLevel: lowerLevel });
        });
        this.characterFeatsAndFeatures()
            .filter(feat =>
                this._featsService.have(
                    feat,
                    { creature: character },
                    { charLevel: higherLevel, minLevel: lowerLevel },
                    { excludeTemporary: true },
                ),
            )
            .forEach(feat => {
                this._cacheService.setFeatChanged(feat.name, { creatureTypeId: 0, minLevel: lowerLevel });
                this._refreshService.prepareChangesByHints(character, feat.hints);

                if (feat.gainAbilityChoice.length) {
                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'abilities');
                }

                if (feat.gainSpellCasting.length || feat.gainSpellChoice.length) {
                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
                }

                if (feat.superType === 'Adopted Ancestry') {
                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
                } else if (feat.name === 'Different Worlds') {
                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
                }

                if (feat.senses.length) {
                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'skills');
                }
            });

        //Reload spellbook if spells were learned between the levels,
        if (character.class.learnedSpells().some(learned => learned.level >= lowerLevel && learned.level <= higherLevel)) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
            //if spells were taken between the levels,
        } else if (this._spellsTakenService.takenSpells(character, lowerLevel, higherLevel).length) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
            //if any spells have a dynamic level dependent on the character level,
        } else if (this._spellsTakenService.takenSpells(character, 0, Defaults.maxCharacterLevel)
            .concat(this._equipmentSpellsService.allGrantedEquipmentSpells(character))
            .some(taken => taken.choice.dynamicLevel.toLowerCase().includes('level'))
        ) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
            //or if you have the cantrip connection or spell battery familiar ability.
        } else if (this._characterService.isFamiliarAvailable()) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'all');
            this.familiar.abilities.feats.map(gain => this._familiarsDataService.familiarAbilities(gain.name)[0]).filter(feat => feat)
                .forEach(feat => {
                    if (feat.name === 'Cantrip Connection') {
                        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
                    }

                    if (feat.name === 'Spell Battery') {
                        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
                    }
                });
        }

        if (this._characterService.isCompanionAvailable()) {
            this._animalCompanionLevelsService.setLevel(this.companion);
        }

        if (this._characterService.isFamiliarAvailable(newLevel)) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'featchoices');
        }

        this._refreshService.processPreparedChanges();
    }

    public onUpdateSkills(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'skills');
        this._refreshService.processPreparedChanges();
    }

    public onUpdateSpellbook(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
        this._refreshService.processPreparedChanges();
    }

    public areLanguagesAvailableOnLevel(levelNumber = 0): boolean {
        const character = this.character;

        if (character.class.ancestry.name) {
            if (levelNumber) {
                // If level is given, check if any new languages have been added on this level.
                // If not, don't get any languages at this point.
                let newLanguages = 0;

                newLanguages += this.characterFeatsAndFeatures()
                    .filter(feat =>
                        (feat.gainLanguages.length || feat.effects.some(effect => effect.affected === 'Max Languages')) &&
                        this._featsService.have(
                            feat,
                            { creature: character },
                            { charLevel: levelNumber, minLevel: levelNumber },
                        ),
                    ).length;
                newLanguages += character.abilityBoosts(levelNumber, levelNumber, 'Intelligence').length;

                if (!newLanguages) {
                    return false;
                }
            }

            return !!character.class.languages.length;
        } else {
            return false;
        }
    }

    public availableLanguagesOnLevel(levelNumber: number): number {
        //Return the amount of languages are available up to the current level
        return this.character.class.languages.filter(language => language.level <= levelNumber || !language.level).length;
    }

    public blankLanguagesOnLevel(levelNumber: number): number {
        //Return the amount of languages that haven't been filled out
        return this.character.class.languages.filter(language => !language.name && language.level <= levelNumber).length;
    }

    public maxAbilityBoostsAvailableInChoice(choice: AbilityChoice): number {
        return choice.maxAvailable(this.character);
    }

    public abilityChoiceTitle(choice: AbilityChoice): string {
        const maxAvailable = this.maxAbilityBoostsAvailableInChoice(choice);
        let title = `Ability ${ choice.infoOnly ? 'Choice (no Boost)' : choice.type }`;

        if (maxAvailable > 1) {
            title += 's';
        }

        title += ` (${ choice.source })`;

        if (maxAvailable > 1) {
            title += `: ${ choice.boosts.length }/${ maxAvailable }`;
        } else {
            if (choice.boosts.length) {
                title += `: ${ choice.boosts[0].name }`;
            }
        }

        return title;
    }

    public abilityChoiceIconTitle(maxAvailable: number, choice: AbilityChoice): string {
        if (choice.boosts.length) {
            if (maxAvailable === 1) {
                return choice.boosts[0].name;
            } else if (maxAvailable > 1) {
                return choice.boosts.length.toString();
            }
        }

        return '';
    }

    public isAbilityTakenByThisChoice(ability: Ability, choice: AbilityChoice, levelNumber: number): boolean {
        return !!this.abilityBoostsOnLevel(
            levelNumber,
            ability.name,
            (choice.infoOnly ? 'Info' : choice.type),
            choice.source,
        ).length;
    }

    public abilities(name = ''): Array<Ability> {
        return this._abilitiesDataService.abilities(name);
    }

    public abilityBaseValue(
        ability: Ability,
        levelNumber: number,
    ): { result: number; explain: string } {
        return this._abilityValuesService.baseValue(ability, this.character, levelNumber);
    }

    public availableAbilities(choice: AbilityChoice, levelNumber: number): Array<Ability> {
        let abilities = this.abilities('');

        if (choice.filter.length) {
            //If there is a filter, we need to find out if any of the filtered Abilities can actually be boosted.
            let cannotBoost = 0;

            choice.filter.forEach(filter => {
                if (this.cannotBoostAbility(this.abilities(filter)[0], levelNumber, choice).length) {
                    cannotBoost += 1;
                }
            });

            // If any can be boosted, filter the list by the filter
            // (and show the already selected abilities so you can unselect them if you like).
            // If none can be boosted, the list just does not get filtered.
            if (cannotBoost < choice.filter.length) {
                abilities = abilities
                    .filter(ability => choice.filter.includes(ability.name) || this._isAbilityBoostedByThisChoice(ability, choice));
            }
        }

        const shouldShowOtherOptions = this.character.settings.showOtherOptions;

        if (abilities.length) {
            return abilities.filter(ability => (
                shouldShowOtherOptions ||
                this._isAbilityBoostedByThisChoice(ability, choice) ||
                (choice.boosts.length < choice.available - ((this.character.baseValues.length) ? choice.baseValuesLost : 0))
            ));
        }
    }

    public areSomeAbilitiesIllegal(choice: AbilityChoice, levelNumber: number): boolean {
        let anytrue = 0;

        choice.boosts.forEach(boost => {
            if (this.isAbilityIllegal(levelNumber, this.abilities(boost.name)[0])) {
                if (!boost.locked) {
                    this._characterBoostAbilityService.boostAbility(boost.name, false, choice, boost.locked);
                    this._refreshService.processPreparedChanges();
                } else {
                    anytrue += 1;
                }
            }
        });

        return !!anytrue;
    }

    public isAbilityIllegal(levelNumber: number, ability: Ability): boolean {
        let isAbilityIllegal = false;
        const maxAbilityValueOnFirstLevel = 18;

        if (
            levelNumber === 1 &&
            this._abilityValuesService.baseValue(
                ability,
                this.character,
                levelNumber,
            ).result > maxAbilityValueOnFirstLevel
        ) {
            isAbilityIllegal = true;
        }

        return isAbilityIllegal;
    }

    public cannotBoostAbility(ability: Ability, levelNumber: number, choice: AbilityChoice): Array<string> {
        //Returns a string of reasons why the ability cannot be boosted, or "". Test the length of the return if you need a boolean.
        //Info only choices that don't grant a boost (like for the key ability for archetypes) don't need to be checked.
        if (choice.infoOnly) { return []; }

        const reasons: Array<string> = [];
        const sameBoostsThisLevel =
            this.abilityBoostsOnLevel(levelNumber, ability.name, choice.type, choice.source)
                .filter(boost => boost.source === choice.source);

        if (sameBoostsThisLevel.length) {
            // The ability may have been boosted by the same source,
            // but as a fixed rule (e.g. fixed ancestry boosts vs. free ancestry boosts).
            // This does not apply to flaws - you can boost a flawed ability.
            if (sameBoostsThisLevel[0].locked) {
                const locked = `Fixed boost by ${ sameBoostsThisLevel[0].source }.`;

                reasons.push(locked);
            } else if (sameBoostsThisLevel[0].sourceId !== choice.id) {
                //If an ability has been raised by a source of the same name, but not the same id, it cannot be raised again.
                //This is the case with backgrounds: You get a choice of two abilities, and then a free one.
                const exclusive = `Boosted by ${ sameBoostsThisLevel[0].source }.`;

                reasons.push(exclusive);
            }
        }

        //On level 1, boosts are not allowed to raise the ability above 18.
        //This is only relevant if you haven't boosted the ability on this level yet.
        //If you have, we don't want to hear that it couldn't be boosted again right away.
        let cannotBoostHigher = '';
        const cannotBoostHigherValue = 16;

        if (
            choice.type === 'Boost' &&
            levelNumber === 1 &&
            this._abilityValuesService.baseValue(
                ability,
                this.character,
                levelNumber,
            ).result > cannotBoostHigherValue &&
            !sameBoostsThisLevel.length
        ) {
            cannotBoostHigher = 'Cannot boost above 18 on level 1.';
            reasons.push(cannotBoostHigher);
        }

        return reasons;
    }

    public abilityBoostsOnLevel(
        levelNumber: number,
        abilityName = '',
        type = '',
        source = '',
        sourceId = '',
        locked: boolean = undefined,
    ): Array<AbilityBoost> {
        return this.character.abilityBoosts(levelNumber, levelNumber, abilityName, type, source, sourceId, locked);
    }

    public onBoostAbility(abilityName: string, boostedEvent: Event, choice: AbilityChoice, locked: boolean): void {
        const hasBeenTaken = (boostedEvent.target as HTMLInputElement).checked;

        if (
            hasBeenTaken &&
            this.character.settings.autoCloseChoices &&
            choice.boosts.length === choice.available - (
                this.character.baseValues.length
                    ? choice.baseValuesLost
                    : 0
            ) - 1
        ) { this.toggleShownList(); }

        this._characterBoostAbilityService.boostAbility(abilityName, hasBeenTaken, choice, locked);
        this._refreshService.prepareChangesByAbility(CreatureTypes.Character, abilityName);
        this._refreshService.processPreparedChanges();
    }

    public skillIncreasesByLevel(
        levelNumber: number,
        skillName: string,
        source = '',
        sourceId = '',
        locked: boolean = undefined,
    ): Array<SkillIncrease> {
        return this.character.skillIncreases(levelNumber, levelNumber, skillName, source, sourceId, locked);
    }

    public skills(name = '', filter: { type?: string; locked?: boolean } = {}, options: { noSubstitutions?: boolean } = {}): Array<Skill> {
        filter = {
            type: '',
            locked: undefined, ...filter,
        };

        return this._characterService.skills(this.character, name, filter, options);
    }

    public size(size: number): string {
        return CreatureSizeName(size);
    }

    public skillBonusFromIntOnLevel(choice: SkillChoice, levelNumber: number): number {
        //Allow INT more skills if INT has been raised since the last level.
        if (choice.source === 'Intelligence') {
            return this._intModifier(levelNumber) - this._intModifier(levelNumber - 1);
        } else {
            return 0;
        }
    }

    public skillChoicesOnLevel(level: ClassLevel): Array<SkillChoice> {
        return level.skillChoices
            .filter(choice => !choice.showOnSheet && (choice.available + this.skillBonusFromIntOnLevel(choice, level.number) > 0));
    }

    public featChoicesOnLevel(level: ClassLevel, specialChoices: boolean = undefined): Array<FeatChoice> {
        const ancestry = this.character.class.ancestry?.name || '';

        return level.featChoices
            .filter(choice =>
                choice.available &&
                !choice.showOnCurrentLevel,
            ).concat(this._featChoicesShownOnCurrentLevel(level))
            .filter(choice =>
                (ancestry || choice.type !== 'Ancestry') &&
                !choice.showOnSheet &&
                (specialChoices === undefined || choice.specialChoice === specialChoices),
            );
    }

    public onLoreChange(checkedEvent: Event, choice: LoreChoice): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices && (choice.increases.length === choice.available - 1)) {
                this.toggleShownList();
            }

            this._characterLoreService.addLore(this.character, choice);
        } else {
            this._characterLoreService.removeLore(this.character, choice);
        }

        this._refreshService.processPreparedChanges();
    }

    public onLoreNameChange(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        this._refreshService.processPreparedChanges();
    }

    public characterFeatsAndFeatures(name = '', type = ''): Array<Feat> {
        return this._featsService.characterFeats(this.character.customFeats, name, type);
    }

    public activityFromName(name: string): Activity {
        return this._activitiesDataService.activityFromName(name);
    }

    public differentWorldsData(levelNumber: number): Array<FeatData> {
        if (this._characterService.characterHasFeat('Different Worlds', levelNumber)) {
            return this.character.class.filteredFeatData(levelNumber, levelNumber, 'Different Worlds');
        }
    }

    public isBlessedBloodAvailable(levelNumber: number): boolean {
        return this._characterService.characterHasFeat('Blessed Blood', levelNumber);
    }

    public blessedBloodDeitySpells(): Array<Spell> {
        const deity = this._characterService.currentCharacterDeities(this.character)[0];

        if (deity) {
            return deity.clericSpells
                .map(spell => this._spellFromName(spell.name))
                .filter(spell => spell && (this.character.settings.showOtherOptions ? true : this.isSpellTakenInBlessedBlood(spell)));
        }
    }

    public blessedBloodSpellsTaken(): number {
        return this.character.class.getSpellsFromSpellList('', 'Feat: Blessed Blood').length;
    }

    public isSpellTakenInBlessedBlood(spell: Spell): boolean {
        return !!this.character.class.getSpellsFromSpellList(spell.name, 'Feat: Blessed Blood').length;
    }

    public onBlessedBloodSpellTaken(spell: Spell, levelNumber: number, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            this.character.class.addSpellListSpell(spell.name, 'Feat: Blessed Blood', levelNumber);
        } else {
            this.character.class.removeSpellListSpell(spell.name, 'Feat: Blessed Blood', levelNumber);
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells');
        this._refreshService.processPreparedChanges();
    }

    public isSplinterFaithAvailable(levelNumber: number): boolean {
        return this._characterService.characterHasFeat('Splinter Faith', levelNumber);
    }

    public splinterFaithDomains(): Readonly<Array<string>> {
        return this.character.class.filteredFeatData(0, 0, 'Splinter Faith')[0]?.valueAsStringArray('domains') || [];
    }

    public setSplinterFaithDomains(domains: Array<string>): void {
        this.character.class.filteredFeatData(0, 0, 'Splinter Faith')[0].setValue('domains', domains);
    }

    public splinterFaithAvailableDomains(): Array<{ title: string; type: number; domain: Domain }> {
        const deityName = this.character.class.deity;

        enum DomainTypes {
            Domains = 1,
            AlternateDomains = 2,
            OtherDomains = 3
        }

        if (deityName) {
            const deity = this._characterService.deities(deityName)[0];

            if (deity) {
                return ([] as Array<{ title: string; type: number; domain: Domain }>)
                    .concat(
                        deity.domains
                            .map((domain, index) => ({
                                title: index ? '' : 'Deity\'s Domains',
                                type: DomainTypes.Domains,
                                domain: this._deitiesDataService.domainFromName(domain) || new Domain(),
                            })),
                    )
                    .concat(
                        deity.alternateDomains
                            .map((domain, index) => ({
                                title: index ? '' : 'Deity\'s Alternate Domains',
                                type: DomainTypes.AlternateDomains,
                                domain: this._deitiesDataService.domainFromName(domain) || new Domain(),
                            })),
                    )
                    .concat(
                        this._deitiesDataService.domains()
                            .filter(domain =>
                                !deity.domains.includes(domain.name) &&
                                !deity.alternateDomains.includes(domain.name),
                            )
                            .map((domain, index) => ({
                                title: index ? '' : 'Other Domains',
                                type: DomainTypes.OtherDomains,
                                domain,
                            }),
                            ),
                    );
            }
        }

        return [];
    }

    public isSplinterFaithThirdDomainTaken(
        availableDomains: Array<{ title: string; type: number; domain: Domain }>,
        takenDomains: Readonly<Array<string>>,
    ): boolean {
        const otherDomainType = 3;

        //Check if any domain with type 3 is among the taken domains.
        return availableDomains
            .some(availableDomain => availableDomain.type === otherDomainType && takenDomains.includes(availableDomain.domain.name));
    }

    public onSplinterFaithDomainTaken(domain: string, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;
        let domains = Array.from(this.splinterFaithDomains());

        if (domains) {
            if (isChecked) {
                domains.push(domain);

                const deityName = this.character.class.deity;

                if (deityName) {
                    const deity = this._characterService.deities(deityName)[0];

                    if (deity) {
                        deity.clearTemporaryDomains();
                    }
                }
            } else {
                domains = domains.filter(takenDomain => takenDomain !== domain);
                this.setSplinterFaithDomains(domains);

                const deityName = this.character.class.deity;

                if (deityName) {
                    const deity = this._characterService.deities(deityName)[0];

                    if (deity) {
                        deity.clearTemporaryDomains();
                    }
                }
            }

            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
            this._refreshService.processPreparedChanges();
        }
    }

    public additionalHeritagesAvailable(levelNumber: number): Array<HeritageGain> {
        //Return all heritages you have gained on this specific level.
        return []
            .concat(
                ...this._characterService.characterFeatsTaken(levelNumber, levelNumber)
                    .map(taken => this.characterFeatsAndFeatures(taken.name)[0])
                    .filter(feat =>
                        feat &&
                        feat.gainHeritage.length,
                    )
                    .map(feat => feat.gainHeritage),
            );
    }

    public additionalHeritageIndex(source: string, level: number): number {
        const oldHeritage =
            this.character.class.additionalHeritages.find(heritage => heritage.source === source && heritage.charLevelAvailable === level);

        if (oldHeritage) {
            return this.character.class.additionalHeritages.indexOf(oldHeritage);
        } else {
            return this.character.class.additionalHeritages.length;
        }
    }

    public onAdditionalHeritageChange(heritage: Heritage, checkedEvent: Event, index: number): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            this._characterHeritageChangeService.changeHeritage(heritage, index);
        } else {
            this._characterHeritageChangeService.changeHeritage(null, index);
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'all');
        this._refreshService.processPreparedChanges();
    }

    public onDifferentWorldsBackgroundChange(levelNumber: number, data: FeatData, background: Background, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;
        const character = this.character;
        const level = character.class.levels[levelNumber];

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            data.setValue('background', background.name);
            background.loreChoices.forEach(choice => {
                const newChoice: LoreChoice = level.addLoreChoice(choice);

                newChoice.source = 'Different Worlds';

                if (newChoice.loreName) {
                    if (this.skills(`Lore: ${ newChoice.loreName }`, {}, { noSubstitutions: true }).length) {
                        const increases =
                            character
                                .skillIncreases(
                                    1,
                                    Defaults.maxCharacterLevel,
                                    `Lore: ${ newChoice.loreName }`,
                                )
                                .filter(increase =>
                                    increase.sourceId.includes('-Lore-'),
                                );

                        if (increases.length) {
                            const oldChoice = character.class.getLoreChoiceBySourceId(increases[0].sourceId);

                            if (oldChoice.available === 1) {
                                this._characterLoreService.removeLore(character, oldChoice);
                            }
                        }
                    }

                    this._characterLoreService.addLore(character, newChoice);
                }
            });
        } else {
            data.setValue('background', '');

            const oldChoice = level.loreChoices.find(choice => choice.source === 'Different Worlds');

            //Remove the lore granted by Different Worlds.
            if (oldChoice) {
                if (oldChoice.increases.length) {
                    this._characterLoreService.removeLore(character, oldChoice);
                }

                level.removeLoreChoice(oldChoice);
            }
        }

        this._refreshService.processPreparedChanges();
    }

    public fuseStanceData(levelNumber: number): Array<FeatData> {
        if (this._characterService.characterFeatsTaken(levelNumber, levelNumber, { featName: 'Fuse Stance' }).length) {
            return this.character.class.filteredFeatData(levelNumber, levelNumber, 'Fuse Stance');
        }
    }

    public fuseStanceChoiceTitle(finished: boolean, fuseStanceData: FeatData): string {
        let result = 'Fuse Stance';
        const name = fuseStanceData.getValue('name');
        const stances = fuseStanceData.valueAsStringArray('stances');

        if (finished && name) {
            result += `: ${ name } (${ stances.join(', ') })`;
        }

        return result;
    }

    public fuseStanceAvailableStances(
        levelNumber: number,
        fuseStanceData: FeatData,
    ): Array<{ activity: Activity; restricted: boolean; reason: string }> {
        // Return all stances that you own.
        // Since Fuse Stance can't use two stances that only allow one type of attack each,
        // we check if one of the previously selected stances does that,
        // and if so, make a note for each available stance with a restriction that it isn't available.
        const shouldShowOtherOptions = this.character.settings.showOtherOptions;
        const unique: Array<string> = [];
        const availableStances: Array<{ activity: Activity; restricted: boolean; reason: string }> = [];
        const conditionsWithAttackRestrictions = this._conditionsDataService.conditions()
            .filter(condition => condition.attackRestrictions.length)
            .map(condition => condition.name);
        const activities = this._activitiesDataService.activities().filter(activity => activity.traits.includes('Stance'));
        const existingStances: Array<Activity> = [];
        const takenStances = fuseStanceData.valueAsStringArray('stances');
        const maxStances = 2;

        takenStances.forEach(stance => {
            existingStances.push(activities.find(example => example.name === stance));
        });

        const areAnyRestrictedStancesFound =
            existingStances.some(example => example.gainConditions.some(gain => conditionsWithAttackRestrictions.includes(gain.name)));

        this._creatureActivitiesService.creatureOwnedActivities(this.character, levelNumber)
            .map(activity => activities.find(example => example.name === activity.name))
            .filter(activity => activity && activity.name !== 'Fused Stance')
            .forEach(activity => {
                const isStanceTaken = takenStances.includes(activity.name);

                if (
                    !unique.includes(activity.name) &&
                    (shouldShowOtherOptions || takenStances.length < maxStances || isStanceTaken)
                ) {
                    const isStanceRestricted = activity.gainConditions.some(gain => conditionsWithAttackRestrictions.includes(gain.name));

                    if (isStanceRestricted && areAnyRestrictedStancesFound && !isStanceTaken) {
                        unique.push(activity.name);
                        availableStances.push({ activity, restricted: isStanceRestricted, reason: 'Incompatible restrictions.' });
                    } else {
                        unique.push(activity.name);
                        availableStances.push({ activity, restricted: isStanceRestricted, reason: '' });
                    }
                }
            });

        //Remove any taken stance that you don't have anymore at this point.
        const realStances =
            takenStances.filter((existingStance: string) => availableStances.map(stance => stance.activity.name).includes(existingStance));

        fuseStanceData.setValue('stances', realStances);

        return availableStances;
    }

    public onFuseStanceNameChange(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
        this._refreshService.processPreparedChanges();
    }

    public onFuseStanceStanceChange(data: FeatData, stance: string, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;
        const stances = Array.from(data.valueAsStringArray('stances'));

        if (isChecked) {
            if (this.character.settings.autoCloseChoices && stances.length === 1 && data.getValue('name')) { this.toggleShownList(); }

            stances.push(stance);
            data.setValue('stances', stances);
        } else {
            data.setValue('stances', stances.filter((existingStance: string) => existingStance !== stance));
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
        this._refreshService.processPreparedChanges();
    }

    public syncretismData(levelNumber: number): Array<FeatData> {
        if (this._characterService.characterFeatsTaken(levelNumber, levelNumber, { featName: 'Syncretism' }).length) {
            return this.character.class.filteredFeatData(levelNumber, levelNumber, 'Syncretism');
        }
    }

    public onSyncretismDeityChange(data: FeatData, deity: Deity, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            data.setValue('deity', deity.name);
        } else {
            data.setValue('deity', '');
        }

        this._characterDeitiesService.clearCharacterDeities();
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
        this._refreshService.processPreparedChanges();
    }

    public characterFeatsTakenOnLevel(
        levelNumber: number,
        filter: 'feature' | 'feat',
    ): Array<FeatTaken> {
        const character = this.character;

        return this._characterService.characterFeatsTaken(levelNumber, levelNumber, { locked: true, automatic: true })
            .filter(taken =>
                (filter === 'feature') === (taken.isFeature(character.class.name)),
            );
    }

    public availableClasses(): Array<Class> {
        const shouldShowOtherOptions = this.character.settings.showOtherOptions;

        return this._classesDataService.classes()
            .filter($class =>
                shouldShowOtherOptions ||
                !this.character.class?.name ||
                $class.name === this.character.class.name,
            )
            .sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public onClassChange($class: Class, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            this._characterClassChangeService.changeClass($class);
        } else {
            this._characterClassChangeService.changeClass();
        }
    }

    public availableAncestries(): Array<Ancestry> {
        const shouldShowOtherOptions = this.character.settings.showOtherOptions;

        return this._historyDataService.ancestries()
            .filter(ancestry =>
                shouldShowOtherOptions ||
                !this.character.class.ancestry?.name ||
                ancestry.name === this.character.class.ancestry.name,
            )
            .sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public onAncestryChange(ancestry: Ancestry, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            this._characterAncestryChangeService.changeAncestry(ancestry);
        } else {
            this._characterAncestryChangeService.changeAncestry();
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'all');
        this._refreshService.processPreparedChanges();
    }

    public availableDeities(name = '', filterForSyncretism = false, charLevel: number = this.character.level): Array<Deity> {
        const character = this.character;
        const currentDeities = this._characterService.currentCharacterDeities(character, '', charLevel);
        const shouldShowOtherOptions = this.character.settings.showOtherOptions;
        const wordFilter = this.deityWordFilter.toLowerCase();

        //Certain classes need to choose a deity allowing their alignment.
        return this._deitiesDataService.deities(name).filter(deity =>
            (
                shouldShowOtherOptions ||
                (
                    filterForSyncretism ?
                        !currentDeities[1] :
                        !currentDeities[0]
                ) ||
                (
                    filterForSyncretism ?
                        ([currentDeities[0].name, currentDeities[1].name].includes(deity.name)) :
                        (deity.name === currentDeities[0].name)
                )
            ) &&
            (
                !character.class.deityFocused ||
                (
                    !this.character.alignment ||
                    deity.followerAlignments.includes(this.character.alignment)
                )
            ) && (
                !wordFilter || (
                    deity.name
                        .concat(
                            deity.desc,
                            deity.sourceBook,
                            ...deity.domains,
                            ...deity.alternateDomains,
                            ...deity.favoredWeapon,
                        )
                        .toLowerCase()
                        .includes(wordFilter)
                )
            ),
        )
            .sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public onDeityChange(deity: Deity, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            this._characterService.changeDeity(deity);
        } else {
            this._characterService.changeDeity(new Deity());
        }

        this._refreshService.processPreparedChanges();
    }

    public availableHeritages(name = '', ancestryName = '', index = -1): Array<Heritage> {
        let heritage = this.character.class.heritage;

        if (index !== -1) {
            heritage = this.character.class.additionalHeritages[index];
        }

        const shouldShowOtherOptions = this.character.settings.showOtherOptions;

        return this._historyDataService.heritages(name, ancestryName)
            .filter(availableHeritage =>
                shouldShowOtherOptions ||
                !heritage?.name ||
                availableHeritage.name === heritage.name ||
                availableHeritage.subTypes?.some(subType => subType.name === heritage.name),
            )
            .sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public doesCharacterHaveHeritage(name: string): boolean {
        return this.character.class.heritage.name === name ||
            this.character.class.additionalHeritages.some(heritage => heritage.name === name);
    }

    public onHeritageChange(heritage: Heritage, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            this._characterHeritageChangeService.changeHeritage(heritage);
        } else {
            this._characterHeritageChangeService.changeHeritage();
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'all');
        this._refreshService.processPreparedChanges();
    }

    public filteredBackgrounds(): Array<Background> {
        return this._historyDataService.backgrounds()
            .filter(background =>
                !background.subType &&
                (!this.adventureBackgrounds ? !background.adventurePath : true) &&
                (!this.regionalBackgrounds ? !background.region : true),
            );
    }

    public availableBackgrounds(): Array<Background> {
        const shouldShowOtherOptions = this.character.settings.showOtherOptions;
        const takenBackgroundNames: Array<string> =
            this.character.class.background
                ? [
                    this.character.class.background.name,
                    this.character.class.background.superType,
                ]
                : [];

        return this.filteredBackgrounds()
            .filter(background =>
                shouldShowOtherOptions ||
                takenBackgroundNames.includes(background.name),
            )
            .sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public subTypesOfBackground(superType: string): Array<Background> {
        return this._historyDataService.backgrounds()
            .filter(background => background.superType === superType);
    }

    public onBackgroundChange(background: Background, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            this._characterBackgroundChangeService.changeBackground(background);
        } else {
            this._characterBackgroundChangeService.changeBackground();
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'all');
        this._refreshService.processPreparedChanges();
    }

    public hasCompanionBecomeAvailableOnLevel(levelNumber: number): boolean {
        //Return whether you have taken a feat this level that granted you an animal companion.
        return this._characterService.characterFeatsTaken(levelNumber, levelNumber)
            .map(taken => this.characterFeatsAndFeatures(taken.name)[0])
            .some(feat => feat && feat.gainAnimalCompanion === 'Young');
    }

    public onResetCompanion(): void {
        if (this._characterService.character.class.animalCompanion) {
            const character = this._characterService.character;

            // Keep the specializations and ID; When the animal companion is reset,
            // any later feats and specializations still remain, and foreign effects still need to apply.
            const previousId = character.class.animalCompanion.id;
            const specializations: Array<AnimalCompanionSpecialization> = character.class.animalCompanion.class.specializations;

            character.class.animalCompanion = new AnimalCompanion();
            character.class.animalCompanion.class = new AnimalCompanionClass();

            if (previousId) { character.class.animalCompanion.id = previousId; }

            if (specializations.length) { character.class.animalCompanion.class.specializations = specializations; }

            this._characterService.initializeAnimalCompanion();
            this._refreshService.processPreparedChanges();
        }
    }

    public availableCompanionTypes(): Array<AnimalCompanionAncestry> {
        const existingCompanionName = this.companion.class.ancestry.name;
        const shouldShowOtherOptions = this.character.settings.showOtherOptions;

        return this._animalCompanionsDataService.companionTypes()
            .filter(type => shouldShowOtherOptions || !existingCompanionName || type.name === existingCompanionName)
            .sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public onChangeCompanionType(type: AnimalCompanionAncestry, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;
        const companion = this.companion;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices && companion.name && companion.species) { this.toggleShownList(); }

            this._animalCompanionAncestryService.changeAncestry(companion, type);
        } else {
            this._animalCompanionAncestryService.changeAncestry(companion, null);
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'all');
        this._cacheService.setLevelChanged({ creatureTypeId: 1, minLevel: 0 });
        this._refreshService.processPreparedChanges();
    }

    public onChangeCompanionSpecialization(spec: AnimalCompanionSpecialization, checkedEvent: Event, levelNumber: number): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;
        const available = this.companionSpecializationsAvailable(levelNumber);

        if (isChecked) {
            if (
                this.character.settings.autoCloseChoices &&
                this.companion.class.specializations
                    .filter(takenSpec => takenSpec.level === levelNumber).length === available - 1
            ) {
                this.toggleShownList();
            }

            this._animalCompanionSpecializationsService.addSpecialization(this.companion, spec, levelNumber);
        } else {
            this._animalCompanionSpecializationsService.removeSpecialization(this.companion, spec);
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'abilities');
        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'skills');
        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'attacks');
        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'defense');
        this._cacheService.setLevelChanged({ creatureTypeId: 1, minLevel: 0 });
        this._refreshService.processPreparedChanges();
    }

    public companionSpecializationsAvailable(levelNumber: number): number {
        //Return how many feats you have taken this level that granted you an animal companion specialization.
        return this._characterService.characterFeatsTaken(levelNumber, levelNumber)
            .map(taken => this.characterFeatsAndFeatures(taken.name)[0])
            .filter(feat => feat && feat.gainAnimalCompanion === 'Specialized').length;
    }

    public availableCompanionSpecializations(levelNumber: number): Array<AnimalCompanionSpecialization> {
        const existingCompanionSpecs = this.companion.class.specializations;
        const available = this.companionSpecializationsAvailable(levelNumber);
        const shouldShowOtherOptions = this.character.settings.showOtherOptions;

        // Get all specializations that were either taken on this level (so they can be deselected)
        // or that were not yet taken if the choice is not exhausted.
        return this._animalCompanionsDataService.companionSpecializations()
            .filter(type =>
                shouldShowOtherOptions ||
                existingCompanionSpecs.some(spec => spec.name === type.name && spec.level === levelNumber) ||
                (existingCompanionSpecs.filter(spec => spec.level === levelNumber).length < available) &&
                !existingCompanionSpecs.some(spec => spec.name === type.name),
            )
            .sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public companionSpecializationsOnLevel(levelNumber: number): Array<string> {
        return this.companion.class.specializations.filter(spec => spec.level === levelNumber).map(spec => spec.name);
    }

    public companionSpecializationChoiceTitle(available: number, taken: Array<string>): string {
        let result = 'Animal Companion Specialization';

        if (available > 1) {
            result += `: ${ taken.length }/${ available }`;
        } else if (taken.length === 1) {
            result += `: ${ taken[0] }`;
        }

        return result;
    }

    public hasCompanionTakenThisSpecialization(name: string): boolean {
        return this.companion.class.specializations.some(spec => spec.name === name);
    }

    public isFamiliarAvailableOnLevel(levelNumber: number): boolean {
        //Return whether you have taken a feat this level that granted you a familiar.
        return this._characterService.characterFeatsTaken(levelNumber, levelNumber)
            .map(taken => this.characterFeatsAndFeatures(taken.name)[0])
            .some(feat => feat && feat.gainFamiliar);
    }

    public onResetFamiliar(): void {
        if (this.character.class.familiar) {
            const character = this._characterService.character;
            //Preserve the origin class and set it again after resetting. Also preserve the ID so that old foreign effects still match.
            const originClass = character.class.familiar.originClass;
            const previousId = character.class.familiar.id;

            this._characterService.removeAllFamiliarAbilities();
            character.class.familiar = new Familiar();

            if (originClass) { character.class.familiar.originClass = originClass; }

            if (previousId) { character.class.familiar.id = previousId; }

            this._characterService.initializeFamiliar();
            this._refreshService.processPreparedChanges();
        }
    }

    public onFamiliarSpeedChange(checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            this.familiar.speeds[1].name = 'Swim Speed';
        } else {
            this.familiar.speeds[1].name = 'Land Speed';
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'general');
        this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'familiarabilities');
        this._refreshService.processPreparedChanges();
    }

    public isFamiliarSwimmer(): boolean {
        return this.familiar.speeds[1].name === 'Swim Speed';
    }

    public grantedCompanionAttacks(type: AnimalCompanionAncestry): Array<Weapon> {
        return type.gainItems
            .filter(gain => !gain.type || gain.type === 'weapons')
            .map(gain =>
                //This is a simplified version of the method in ItemGain. It can't find "special" ItemGains, which aren't needed here.
                this._characterService.cleanItems().weapons.find(weapon => gain.isMatchingItem(weapon)),
            );
    }

    public animalCompanionAbilities(type: AnimalCompanionAncestry): Array<{ name: string; modifier: string }> {
        const abilities: [{ name: string; modifier: string }] = [{ name: '', modifier: '' }];

        this._characterService.abilities().forEach(ability => {
            const name = ability.modifierName;
            let modifier = 0;
            const classboosts = this.companion.class.levels[1].abilityChoices[0].boosts.filter(boost => boost.name === ability.name);
            const ancestryboosts = type.abilityChoices[0].boosts.filter(boost => boost.name === ability.name);

            /* modifier =
                ancestryboosts
                    .concat(classboosts)
                    .filter(boost => boost.type === 'Boost').length
                - ancestryboosts
                    .concat(classboosts)
                    .filter(boost => boost.type === 'Flaw').length;*/

            //TO-DO: Does this work the same way?
            modifier = ancestryboosts
                .concat(classboosts)
                .reduce((prev, current) => {
                    switch (current.type) {
                        case 'Boost':
                            return prev + 1;
                        case 'Flaw':
                            return prev - 1;
                        default:
                            return 0;
                    }
                }, 0);
            abilities.push({ name, modifier: (modifier > 0 ? '+' : '') + modifier.toString() });
        });
        abilities.shift();

        return abilities;
    }

    public addBonusAbilityChoice(level: ClassLevel, type: 'Boost' | 'Flaw'): void {
        const newChoice = new AbilityChoice();

        newChoice.available = 1;
        newChoice.type = type;
        newChoice.source = this.bonusSource || 'Bonus';
        newChoice.bonus = true;
        level.addAbilityChoice(newChoice);
    }

    public removeBonusAbilityChoice(choice: AbilityChoice, levelNumber: number): void {
        choice.boosts.forEach(boost => {
            this._characterBoostAbilityService.boostAbility(boost.name, false, choice, false);
            this._refreshService.prepareChangesByAbility(CreatureTypes.Character, boost.name);
        });

        const level = this.character.classLevelFromNumber(levelNumber);

        level.removeAbilityChoice(choice);
        this.toggleShownList();
        this._refreshService.processPreparedChanges();
    }

    public addBonusSkillChoice(level: ClassLevel, type: 'Perception' | 'Save' | 'Skill'): void {
        const newChoice = new SkillChoice();

        newChoice.available = 1;
        newChoice.type = type;
        newChoice.source = this.bonusSource || 'Bonus';
        newChoice.bonus = true;
        level.addSkillChoice(newChoice);
    }

    public addBonusFeatChoice(level: ClassLevel, type: 'Ancestry' | 'Class' | 'General' | 'Skill'): void {
        const newChoice = new FeatChoice();

        newChoice.available = 1;
        newChoice.type = type;
        newChoice.source = this.bonusSource || 'Bonus';
        newChoice.bonus = true;
        level.addFeatChoice(newChoice);
    }

    public addBonusLoreChoice(level: ClassLevel): void {
        const newChoice = new LoreChoice();

        newChoice.available = 1;
        newChoice.source = this.bonusSource || 'Bonus';
        newChoice.bonus = true;
        level.addLoreChoice(newChoice);
    }

    public removeBonusLoreChoice(choice: LoreChoice, levelNumber: number): void {
        const character = this.character;
        const level = character.classLevelFromNumber(levelNumber);

        if (choice.loreName) {
            this._characterLoreService.removeLore(character, choice);
        }

        level.removeLoreChoice(choice);

        this.toggleShownList();
        this._refreshService.processPreparedChanges();
    }

    public ngOnInit(): void {
        //Start with the about page in desktop mode, and without it on mobile.
        this._showList = this.isMobile ? '' : 'about';

        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['character', 'all', 'charactersheet'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'character' && ['charactersheet', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _resetChoiceArea(): void {
        // Scroll up to the top of the choice area. This is only needed in desktop mode,
        // where you can switch between choices without closing the first,
        // and it would cause the top bar to scroll away in mobile mode.
        if (!DisplayService.isMobile) {
            document.getElementById('character-choiceArea-top').scrollIntoView({ behavior: 'smooth' });
        }
    }

    private _deleteCharacterFromDB(savegame: Savegame): void {
        this._characterDeletingService.deleteCharacter(savegame);
    }

    private _isFirstLoad(): boolean {
        return this._characterService.isFirstLoad();
    }

    private _isAbilityBoostedByThisChoice(ability: Ability, choice: AbilityChoice): boolean {
        return choice.boosts.some(boost => ['Boost', 'Info'].includes(boost.type) && boost.name === ability.name);
    }

    private _intModifier(levelNumber: number): number {
        if (!levelNumber) {
            return 0;
        }

        //We have to calculate the modifier instead of getting .mod() because we don't want any effects in the character building interface.
        const intelligence: number =
            this._abilityValuesService.baseValue('Intelligence', this.character, levelNumber).result;

        return AbilityModFromAbilityValue(intelligence);
    }

    //TO-DO: Check if this still works.
    private _featChoicesShownOnCurrentLevel(level: ClassLevel): Array<FeatChoice> {
        if (this.character.level === level.number) {
            return ([] as Array<FeatChoice>)
                .concat(
                    ...this.character.class.levels
                        .map(classLevel => classLevel.featChoices.filter(choice => choice.showOnCurrentLevel)),
                );
        } else {
            return [];
        }
    }

    private _spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

}
