import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ClassesService } from 'src/app/services/classes.service';
import { Class } from 'src/app/classes/Class';
import { Level } from 'src/app/classes/Level';
import { AbilitiesService } from 'src/app/services/abilities.service';
import { EffectsService } from 'src/app/services/effects.service';
import { FeatsService } from 'src/app/services/feats.service';
import { HistoryService } from 'src/app/services/history.service';
import { Ancestry } from 'src/app/classes/Ancestry';
import { Heritage } from 'src/app/classes/Heritage';
import { ItemsService } from 'src/app/services/items.service';
import { Background } from 'src/app/classes/Background';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { Ability } from 'src/app/classes/Ability';
import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { ActivitiesService } from 'src/app/services/activities.service';
import { Deity } from 'src/app/classes/Deity';
import { DeitiesService } from 'src/app/services/deities.service';
import { SpellsService } from 'src/app/services/spells.service';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { ItemGain } from 'src/app/classes/ItemGain';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { AnimalCompanionsService } from 'src/app/services/animalcompanions.service';
import { AnimalCompanionClass } from 'src/app/classes/AnimalCompanionClass';
import { ConditionsService } from 'src/app/services/conditions.service';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { Familiar } from 'src/app/classes/Familiar';
import { SavegameService } from 'src/app/services/savegame.service';
import { Savegame } from 'src/app/classes/Savegame';
import { TraitsService } from 'src/app/services/traits.service';
import { FamiliarsService } from 'src/app/services/familiars.service';
import { Item } from 'src/app/classes/Item';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { Spell } from 'src/app/classes/Spell';
import { Character } from 'src/app/classes/Character';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { Activity } from 'src/app/classes/Activity';
import { Domain } from 'src/app/classes/Domain';
import { ConfigService } from 'src/app/services/config.service';
import { default as package_json } from 'package.json';
import { FeatData } from 'src/app/character-creation/definitions/models/FeatData';
import { RefreshService } from 'src/app/services/refresh.service';
import { CacheService } from 'src/app/services/cache.service';
import { Subscription } from 'rxjs';
import { HeritageGain } from 'src/app/classes/HeritageGain';
import { InputValidationService } from 'src/app/services/inputValidation.service';
import { DisplayService } from 'src/app/services/display.service';

type ShowContent = FeatChoice | SkillChoice | AbilityChoice | LoreChoice | { id: string, source?: string };

@Component({
    selector: 'app-character',
    templateUrl: './character.component.html',
    styleUrls: ['./character.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterComponent implements OnInit, OnDestroy {

    public newClass: Class = new Class();
    private showLevel = 0;
    private showItem = '';
    private showList = '';
    private showLevelFilter = false;
    private showContent: ShowContent = null;
    private showContentLevelNumber = 0;
    private showFixedChangesLevelNumber = 0;
    public adventureBackgrounds = true;
    public regionalBackgrounds = true;
    public deityWordFilter = '';
    public loadAsGM = false;
    public blankCharacter: Character = new Character();
    public bonusSource = 'Bonus';
    public versionString: string = package_json.version;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private refreshService: RefreshService,
        public configService: ConfigService,
        public classesService: ClassesService,
        public abilitiesService: AbilitiesService,
        public effectsService: EffectsService,
        public featsService: FeatsService,
        public historyService: HistoryService,
        private itemsService: ItemsService,
        private activitiesService: ActivitiesService,
        private deitiesService: DeitiesService,
        private spellsService: SpellsService,
        private animalCompanionsService: AnimalCompanionsService,
        private conditionsService: ConditionsService,
        private savegameService: SavegameService,
        private traitsService: TraitsService,
        private familiarsService: FamiliarsService,
        private cacheService: CacheService,
        private modalService: NgbModal,
        public modal: NgbActiveModal
    ) { }

    minimize() {
        this.characterService.get_Character().settings.characterMinimized = !this.characterService.get_Character().settings.characterMinimized;
    }

    get_Minimized() {
        return this.characterService.get_Character().settings.characterMinimized;
    }

    get_Mobile() {
        return DisplayService.isMobile;
    }

    get_GMMode() {
        return this.characterService.get_GMMode();
    }

    toggleCharacterMenu() {
        this.characterService.toggle_Menu('character');
    }

    get_CharacterMenuState() {
        return this.characterService.get_CharacterMenuState();
    }

    get_CharacterLoadedOrCreated() {
        return this.characterService.get_CharacterLoadedOrCreated();
    }

    toggle_Level(levelNumber: number) {
        if (this.showLevel == levelNumber) {
            this.showLevel = 0;
        } else {
            this.showLevel = levelNumber;
        }
    }

    toggle_Item(name: string) {
        if (this.showItem == name) {
            this.showItem = '';
        } else {
            this.showItem = name;
        }
    }

    toggle_List(name: string, levelNumber = 0, content: ShowContent = null) {
        //Set the currently shown list name, level number and content so that the correct choice with the correct data can be shown in the choice area.
        if (this.showList == name &&
            (!levelNumber || this.showContentLevelNumber == levelNumber) &&
            (!content || JSON.stringify(this.showContent) == JSON.stringify(content))
        ) {
            this.showList = '';
            this.showContentLevelNumber = 0;
            this.showContent = null;
        } else {
            this.showList = name;
            this.showContentLevelNumber = levelNumber;
            this.showContent = content;
            this.reset_ChoiceArea();
        }
    }

    toggle_LevelFilter() {
        this.showLevelFilter = !this.showLevelFilter;
    }

    reset_ChoiceArea() {
        //Scroll up to the top of the choice area. This is only needed in desktop mode, where you can switch between choices without closing the first,
        // and it would cause the top bar to scroll away in mobile mode.
        if (!DisplayService.isMobile) {
            document.getElementById('character-choiceArea-top').scrollIntoView({ behavior: 'smooth' });
        }
    }

    receive_ChoiceMessage(message: { name: string, levelNumber: number, choice: SkillChoice | FeatChoice }) {
        this.toggle_List(message.name, message.levelNumber, message.choice);
    }

    receive_FeatMessage(name: string) {
        this.toggle_Item(name);
    }

    get_ShowLevel() {
        return this.showLevel;
    }

    get_ShowItem() {
        return this.showItem;
    }

    get_ShowList() {
        return this.showList;
    }

    get_ShowLevelFilter() {
        return this.showLevelFilter;
    }

    get_ActiveChoiceContent(choiceType = '') {
        //For choices that have a class of their own (AbilityChoice, SkillChoice, FeatChoice), get the currently shown content with levelNumber if it is of that same class.
        //Also get the currently shown list name for compatibility.
        if (this.showContent?.constructor.name == choiceType) {
            return [{ name: this.get_ShowList(), levelNumber: this.get_ShowContentLevelNumber(), choice: this.get_ShowContent() }];
        }
        return [];
    }

    get_ActiveAbilityChoiceContent() {
        return this.get_ActiveChoiceContent('AbilityChoice') as { name: string, levelNumber: number, choice: AbilityChoice }[];
    }

    get_ActiveSkillChoiceContent() {
        return this.get_ActiveChoiceContent('SkillChoice') as { name: string, levelNumber: number, choice: SkillChoice }[];
    }

    get_ActiveFeatChoiceContent() {
        return this.get_ActiveChoiceContent('FeatChoice') as { name: string, levelNumber: number, choice: FeatChoice }[];
    }

    get_ActiveLoreChoiceContent() {
        return this.get_ActiveChoiceContent('LoreChoice') as { name: string, levelNumber: number, choice: LoreChoice }[];
    }

    get_ActiveSpecialChoiceShown(choiceType = '') {
        if (this.get_ShowList() == choiceType) {
            //For choices that don't have a class and can only show up once per level, get the currently shown list name with levelNumber if the list name matches the choice type.
            //Also get a "choice" object with a unique ID (the list name and the level number) for compatibility with TrackByID(), unless there is a current content with an id property.
            return [{
                name: choiceType,
                levelNumber: this.get_ShowContentLevelNumber(),
                choice: this.get_ShowContent()?.['id'] ? this.get_ShowContent() : { id: choiceType + this.get_ShowContentLevelNumber().toString() }
            }];
        }
    }

    get_ShowContent() {
        return this.showContent;
    }

    get_ShowContentLevelNumber() {
        return this.showContentLevelNumber;
    }

    toggle_FixedChangesLevelNumber(levelNumber: number) {
        if (this.showFixedChangesLevelNumber == levelNumber) {
            this.showFixedChangesLevelNumber = 0;
        } else {
            this.showFixedChangesLevelNumber = levelNumber;
        }
    }

    get_ShowFixedChangesLevelNumber() {
        return this.showFixedChangesLevelNumber;
    }

    set_Accent() {
        this.characterService.set_Accent();
    }

    set_Darkmode() {
        this.characterService.set_Darkmode();
    }

    toggle_TileMode() {
        this.get_Character().settings.characterTileMode = !this.get_Character().settings.characterTileMode;
        this.refreshService.set_ToChange('Character', 'featchoices');
        this.refreshService.set_ToChange('Character', 'skillchoices');
        this.refreshService.process_ToChange();
    }

    get_TileMode() {
        return this.get_Character().settings.characterTileMode;
    }

    trackByIndex(index: number): number {
        return index;
    }

    trackByID(index: number, obj: { choice: ShowContent }): string {
        //Track ability, skiil or feat choices choices by id, so that when the selected choice changes, the choice area content is updated.
        // The choice area content is only ever one choice, so the index would always be 0.
        return obj.choice.id;
    }

    onNewCharacter() {
        if (this.characterService.get_CharacterLoadedOrCreated()) {
            this.toggle_List('');
            this.characterService.reset_Character();
        } else {
            this.characterService.set_CharacterLoadedOrCreated();
        }
    }

    onManualMode() {
        //Manual mode changes some buttons on some components, so we need to refresh these.
        this.refreshService.set_ToChange('Character', 'activities');
        this.refreshService.set_ToChange('Companion', 'activities');
        this.refreshService.set_ToChange('Familiar', 'activities');
        this.refreshService.set_ToChange('Character', 'health');
        this.refreshService.set_ToChange('Companion', 'health');
        this.refreshService.set_ToChange('Familiar', 'health');
        this.refreshService.set_ToChange('Character', 'inventory');
        this.refreshService.set_ToChange('Companion', 'inventory');
        this.refreshService.set_ToChange('Character', 'spellbook');
        this.refreshService.set_ToChange('Character', 'top-bar');
        this.refreshService.process_ToChange();
    }

    onRetryDatabaseConnection() {
        this.savegameService.reset();
    }

    onRetryLogin() {
        this.configService.get_Login('', this.characterService, this.savegameService);
    }

    get_SavegamesInitializing() {
        return this.savegameService.still_loading();
    }

    get_LoggingIn() {
        return this.configService.get_LoggingIn();
    }

    get_Database() {
        return this.configService.get_HasDBConnectionURL();
    }

    get_LoggedIn() {
        return this.configService.get_LoggedIn();
    }

    get_CannotLogin() {
        return this.configService.get_CannotLogin();
    }

    get_Savegames() {
        if (!this.savegameService.get_LoadingError()) {
            return this.savegameService.get_Savegames()
                .sort(function (a, b) {
                    if (b.partyName == 'No Party' && a.partyName != 'No Party') {
                        return 1;
                    }
                    if (a.partyName == 'No Party' && b.partyName != 'No Party') {
                        return -1;
                    }
                    return (a.partyName + a.name == b.partyName + b.name) ? 0 : ((a.partyName + a.name > b.partyName + b.name) ? 1 : -1);
                });
        } else {
            return null;
        }
    }

    get_SavegameTitle(savegame: Savegame) {
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

    get_Parties() {
        return Array.from(new Set(this.get_Savegames().map(savegame => savegame.partyName)));
    }

    load_CharacterFromDB(savegame: Savegame) {
        this.characterService.set_CharacterLoadedOrCreated();
        this.toggleCharacterMenu();
        this.characterService.reset_Character(savegame.id, this.loadAsGM);
    }

    delete_CharacterFromDB(savegame: Savegame) {
        this.characterService.delete_Character(savegame);
    }

    save_CharacterToDB() {
        this.characterService.save_Character();
    }

    open_DeleteModal(content, savegame: Savegame) {
        this.modalService.open(content, { centered: true, ariaLabelledBy: 'modal-title' }).result.then((result) => {
            if (result == 'Ok click') {
                this.delete_CharacterFromDB(savegame);
            }
        });
    }

    get_FirstTime() {
        return this.characterService.get_FirstTime();
    }

    get_CloseButtonTitle() {
        if (this.get_FirstTime()) {
            return 'Go to Character Sheet';
        } else {
            return 'Back to Character Sheet';
        }
    }

    get_IsBlankCharacter() {
        return this.characterService.get_IsBlankCharacter();
    }

    get_Alignments() {
        const deity: Deity = this.get_Character().class?.deity ? this.deitiesService.get_Deities(this.get_Character().class.deity)[0] : null;
        const alignments = [
            '',
            'Lawful Good',
            'Neutral Good',
            'Chaotic Good',
            'Lawful Neutral',
            'Neutral',
            'Chaotic Neutral',
            'Lawful Evil',
            'Neutral Evil',
            'Chaotic Evil'
        ];
        //Certain classes need to pick an alignment matching their deity
        if (deity && this.get_Character().class.deityFocused) {
            return alignments.filter(alignment =>
                !deity.followerAlignments ||
                deity.followerAlignments.includes(alignment) ||
                alignment == ''
            );
        } else {
            return alignments;
        }

    }

    get_Level(number: number) {
        return this.get_Character().class.levels[number];
    }

    onBaseValueChange() {
        const baseValues = this.get_Character().baseValues;
        if (baseValues.length) {
            baseValues.length = 0;
        } else {
            this.get_Abilities().forEach(ability => {
                baseValues.push({ name: ability.name, baseValue: 10 });
            });
            //Remove all Level 1 ability boosts that are now illegal
            if (this.get_Character().class.name) {
                this.get_Character().class.levels[1].abilityChoices.filter(choice => choice.available).forEach(choice => {
                    choice.boosts.length = Math.min(choice.available - choice.baseValuesLost, choice.boosts.length);
                });
            }
        }
        this.refreshService.set_ToChange('Character', 'abilities');
        this.refreshService.set_ToChange('Character', 'individualskills', 'all');
        this.refreshService.set_ToChange('Character', 'charactersheet');
        this.refreshService.process_ToChange();
    }

    onAbilityChange(name: string) {
        this.refreshService.set_AbilityToChange('Character', name, { characterService: this.characterService });
    }

    set_Changed(target = '') {
        this.refreshService.set_Changed(target);
    }

    onLanguageChange() {
        this.refreshService.set_ToChange('Character', 'general');
        this.refreshService.set_ToChange('Character', 'charactersheet');
        this.refreshService.process_ToChange();
    }

    onNameChange() {
        this.refreshService.set_ToChange('Character', 'general');
        this.refreshService.set_ToChange('Character', 'top-bar');
        this.refreshService.process_ToChange();
    }

    onAlignmentChange() {
        this.refreshService.set_ToChange('Character', 'general');
        this.refreshService.set_ToChange('Character', 'charactersheet');
        this.refreshService.set_ToChange('Character', 'featchoices');
        this.refreshService.set_ToChange('Character', 'effects');
        this.refreshService.process_ToChange();
    }

    onHiddenFeatsChange() {
        this.refreshService.set_ToChange('Character', 'charactersheet');
        this.refreshService.set_ToChange('Character', 'featchoices');
        this.refreshService.process_ToChange();
    }

    positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    get_Traits(traitName = '') {
        return this.traitsService.get_Traits(traitName);
    }

    onLevelUp() {
        const character = this.get_Character();
        const oldLevel = character.level;
        character.level += 1;
        character.experiencePoints -= 1000;
        this.onLevelChange(oldLevel);
    }

    onLevelChange(oldLevel: number) {
        const character = this.get_Character();
        const newLevel = character.level;
        //If we went up levels, prepare to repeat any onceEffects of Feats that apply inbetween, such as recovering Focus Points for a larger Focus Pool.
        if (newLevel > oldLevel) {
            this.get_CharacterFeatsAndFeatures().filter(feat => feat.onceEffects.length && feat.have({ creature: character }, { characterService: this.characterService }, { charLevel: newLevel, minLevel: (oldLevel + 1) }, { excludeTemporary: true }))
                .forEach(feat => {
                    feat.onceEffects.forEach(effect => {
                        this.characterService.prepare_OnceEffect(character, effect);
                    });
                });
        }

        //Find all the differences between the levels and refresh components accordingly.
        const lowerLevel = Math.min(oldLevel, newLevel);
        const higherLevel = Math.max(oldLevel, newLevel);

        character.class.levels.filter(level => level.number >= lowerLevel && level.number <= higherLevel).forEach(level => {
            level.featChoices.forEach(choice => {
                if (choice.showOnSheet) {
                    this.refreshService.set_ToChange('Character', 'activities');
                }
            });
        });
        character.class.levels.forEach(level => {
            level.featChoices.forEach(choice => {
                if (choice.showOnCurrentLevel) {
                    this.refreshService.set_ToChange('Character', 'featchoices');
                }
                choice.feats.forEach(taken => {
                    this.cacheService.set_FeatChanged(taken.name, { creatureTypeId: 0, minLevel: lowerLevel, maxLevel: higherLevel });
                });
            });
        });
        this.refreshService.set_ToChange('Character', 'charactersheet');
        this.refreshService.set_ToChange('Character', 'character-sheet');
        this.refreshService.set_ToChange('Character', 'effects');
        this.refreshService.set_ToChange('Character', 'top-bar');
        this.refreshService.set_ToChange('Character', 'health');
        this.refreshService.set_ToChange('Character', 'defense');
        this.refreshService.set_ToChange('Character', 'attacks');
        this.refreshService.set_ToChange('Character', 'general');
        this.refreshService.set_ToChange('Character', 'individualspells', 'all');
        this.refreshService.set_ToChange('Character', 'activities');
        this.refreshService.set_ToChange('Character', 'spells');
        this.refreshService.set_ToChange('Character', 'spellbook');
        character.get_AbilityBoosts(lowerLevel, higherLevel).forEach(boost => {
            this.refreshService.set_ToChange('Character', 'abilities');
            this.cacheService.set_AbilityChanged(boost.name, { creatureTypeId: 0, minLevel: lowerLevel });
        });
        character.get_SkillIncreases(this.characterService, lowerLevel, higherLevel).forEach(increase => {
            this.refreshService.set_ToChange('Character', 'skillchoices');
            this.refreshService.set_ToChange('Character', 'individualSkills', increase.name);
            this.cacheService.set_SkillChanged(increase.name, { creatureTypeId: 0, minLevel: lowerLevel });
        });
        this.get_CharacterFeatsAndFeatures().filter(feat => feat.have({ creature: character }, { characterService: this.characterService }, { charLevel: higherLevel, minLevel: lowerLevel }, { excludeTemporary: true }))
            .forEach(feat => {
                this.cacheService.set_FeatChanged(feat.name, { creatureTypeId: 0, minLevel: lowerLevel });
                this.refreshService.set_HintsToChange(character, feat.hints, { characterService: this.characterService });
                if (feat.gainAbilityChoice.length) {
                    this.refreshService.set_ToChange('Character', 'abilities');
                }
                if (feat.gainSpellCasting.length || feat.gainSpellChoice.length) {
                    this.refreshService.set_ToChange('Character', 'spellbook');
                }
                if (feat.superType == 'Adopted Ancestry') {
                    this.refreshService.set_ToChange('Character', 'general');
                } else if (feat.name == 'Different Worlds') {
                    this.refreshService.set_ToChange('Character', 'general');
                }
                if (feat.senses.length) {
                    this.refreshService.set_ToChange('Character', 'skills');
                }
            });
        //Reload spellbook if spells were learned between the levels,
        if (character.get_SpellsLearned().some(learned => learned.level >= lowerLevel && learned.level <= higherLevel)) {
            this.refreshService.set_ToChange('Character', 'spellbook');
            //if spells were taken between the levels,
        } else if (character.get_SpellsTaken(lowerLevel, higherLevel, { characterService: this.characterService }).length) {
            this.refreshService.set_ToChange('Character', 'spellbook');
            //if any spells have a dynamic level dependent on the character level,
        } else if (character.get_SpellsTaken(0, 20, { characterService: this.characterService })
            .concat(character.get_AllEquipmentSpellsGranted())
            .some(taken => taken.choice.dynamicLevel.toLowerCase().includes('level'))
        ) {
            this.refreshService.set_ToChange('Character', 'spellbook');
            //or if you have the cantrip connection or spell battery familiar ability.
        } else if (this.characterService.get_FamiliarAvailable()) {
            this.refreshService.set_ToChange('Familiar', 'all');
            this.get_Familiar().abilities.feats.map(gain => this.familiarsService.get_FamiliarAbilities(gain.name)[0]).filter(feat => feat).forEach(feat => {
                if (feat.name == 'Cantrip Connection') {
                    this.refreshService.set_ToChange('Character', 'spellbook');
                }
                if (feat.name == 'Spell Battery') {
                    this.refreshService.set_ToChange('Character', 'spellbook');
                }
            });
        }
        if (this.characterService.get_CompanionAvailable()) {
            this.get_Companion().set_Level(this.characterService);
        }
        if (this.characterService.get_FamiliarAvailable(newLevel)) {
            this.refreshService.set_ToChange('Familiar', 'featchoices');
        }

        this.refreshService.process_ToChange();
    }

    onUpdateSkills() {
        this.refreshService.set_ToChange('Character', 'skills');
        this.refreshService.process_ToChange();
    }

    onUpdateSpellbook() {
        this.refreshService.set_ToChange('Character', 'spellbook');
        this.refreshService.process_ToChange();
    }

    get_LanguagesAvailable(levelNumber = 0) {
        const character = this.get_Character();
        if (character.class.ancestry.name) {
            if (levelNumber) {
                //If level is given, check if any new languages have been added on this level. If not, don't get any languages at this point.
                let newLanguages = 0;
                newLanguages += this.get_CharacterFeatsAndFeatures().filter(feat => (feat.gainLanguages.length || feat.effects.some(effect => effect.affected == 'Max Languages')) && feat.have({ creature: character }, { characterService: this.characterService }, { charLevel: levelNumber, minLevel: levelNumber })).length;
                newLanguages += character.get_AbilityBoosts(levelNumber, levelNumber, 'Intelligence').length;
                if (!newLanguages) {
                    return false;
                }
            }
            return character.class.languages.length ? true : false;
        } else {
            return false;
        }
    }

    get_CurrentLanguages(levelNumber: number) {
        //Return the amount of languages are available up to the current level
        return this.get_Character().class.languages.filter(language => language.level <= levelNumber || !language.level).length;
    }

    get_BlankLanguages(levelNumber: number) {
        //Return the amount of languages that haven't been filled out
        return this.get_Character().class.languages.filter(language => !language.name && language.level <= levelNumber).length;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_MaxAvailable(choice: AbilityChoice) {
        return choice.maxAvailable(this.get_Character());
    }

    get_AbilityChoiceTitle(choice: AbilityChoice) {
        const maxAvailable = this.get_MaxAvailable(choice);
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

    get_AbilityTakenByThis(ability: Ability, choice: AbilityChoice, levelNumber: number) {
        return this.get_AbilityBoosts(levelNumber, levelNumber, ability.name, (choice.infoOnly ? 'Info' : choice.type), choice.source).length;
    }

    get_Abilities(name = '') {
        return this.characterService.get_Abilities(name);
    }

    get_AvailableAbilities(choice: AbilityChoice, levelNumber: number) {
        let abilities = this.get_Abilities('');
        if (choice.filter.length) {
            //If there is a filter, we need to find out if any of the filtered Abilities can actually be boosted.
            let cannotBoost = 0;
            choice.filter.forEach(filter => {
                if (this.cannotBoost(this.get_Abilities(filter)[0], levelNumber, choice).length) {
                    cannotBoost += 1;
                }
            });
            //If any can be boosted, filter the list by the filter (and show the already selected abilities so you can unselect them if you like).
            //If none can be boosted, the list just does not get filtered.
            if (cannotBoost < choice.filter.length) {
                abilities = abilities.filter(ability => choice.filter.includes(ability.name) || this.abilityBoostedByThis(ability, choice));
            }
        }
        const showOtherOptions = this.get_Character().settings.showOtherOptions;
        if (abilities.length) {
            return abilities.filter(ability => (
                showOtherOptions ||
                this.abilityBoostedByThis(ability, choice) ||
                (choice.boosts.length < choice.available - ((this.get_Character().baseValues.length) ? choice.baseValuesLost : 0))
            ));
        }
    }

    someAbilitiesIllegal(choice: AbilityChoice, levelNumber: number) {
        let anytrue = 0;
        choice.boosts.forEach(boost => {
            if (this.abilityIllegal(levelNumber, this.get_Abilities(boost.name)[0])) {
                if (!boost.locked) {
                    this.get_Character().boost_Ability(this.characterService, boost.name, false, choice, boost.locked);
                    this.refreshService.process_ToChange();
                } else {
                    anytrue += 1;
                }
            }
        });
        return anytrue;
    }

    abilityIllegal(levelNumber: number, ability: Ability) {
        let illegal = false;
        if (levelNumber == 1 && ability.baseValue(this.get_Character(), this.characterService, levelNumber).result > 18) {
            illegal = true;
        }
        return illegal;
    }

    cannotBoost(ability: Ability, levelNumber: number, choice: AbilityChoice) {
        //Returns a string of reasons why the ability cannot be boosted, or "". Test the length of the return if you need a boolean.
        //Info only choices that don't grant a boost (like for the key ability for archetypes) don't need to be checked.
        if (choice.infoOnly) { return []; }
        const reasons: string[] = [];
        const sameBoostsThisLevel = this.get_AbilityBoosts(levelNumber, levelNumber, ability.name, choice.type, choice.source).filter(boost => boost.source == choice.source);
        if (sameBoostsThisLevel.length) {
            //The ability may have been boosted by the same source, but as a fixed rule (e.g. fixed ancestry boosts vs. free ancestry boosts).
            //This does not apply to flaws - you can boost a flawed ability.
            if (sameBoostsThisLevel[0].locked) {
                const locked = `Fixed boost by ${ sameBoostsThisLevel[0].source }.`;
                reasons.push(locked);
            } else if (sameBoostsThisLevel[0].sourceId != choice.id) {
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
        if (choice.type == 'Boost' && levelNumber == 1 && ability.baseValue(this.get_Character(), this.characterService, levelNumber).result > 16 && !sameBoostsThisLevel.length) {
            cannotBoostHigher = 'Cannot boost above 18 on level 1.';
            reasons.push(cannotBoostHigher);
        }
        return reasons;
    }

    abilityBoostedByThis(ability: Ability, choice: AbilityChoice) {
        return choice.boosts.filter(boost => ['Boost', 'Info'].includes(boost.type) && boost.name == ability.name).length;
    }

    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName = '', type = '', source = '', sourceId = '', locked: boolean = undefined) {
        return this.get_Character().get_AbilityBoosts(minLevelNumber, maxLevelNumber, abilityName, type, source, sourceId, locked);
    }

    onAbilityBoost(abilityName: string, boostedEvent: Event, choice: AbilityChoice, locked: boolean) {
        const boost = (<HTMLInputElement>boostedEvent.target).checked;
        if (boost && this.get_Character().settings.autoCloseChoices && choice.boosts.length == choice.available - ((this.get_Character().baseValues.length) ? choice.baseValuesLost : 0) - 1) { this.toggle_List(''); }
        this.get_Character().boost_Ability(this.characterService, abilityName, boost, choice, locked);
        this.refreshService.set_AbilityToChange('Character', abilityName, { characterService: this.characterService });
        this.refreshService.process_ToChange();
    }

    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skillName: string, source = '', sourceId = '', locked: boolean = undefined) {
        return this.get_Character().get_SkillIncreases(this.characterService, minLevelNumber, maxLevelNumber, skillName, source, sourceId, locked);
    }

    get_Skills(name = '', filter: { type?: string, locked?: boolean } = {}, options: { noSubstitutions?: boolean } = {}) {
        filter = Object.assign({
            type: '',
            locked: undefined
        }, filter);
        return this.characterService.get_Skills(this.get_Character(), name, filter, options);
    }

    size(size: number) {
        switch (size) {
            case -1:
                return 'Small';
            case 0:
                return 'Medium';
            case 1:
                return 'Large';
        }
    }

    get_INT(levelNumber: number) {
        if (!levelNumber) {
            return 0;
        }
        //We have to calculate the modifier instead of getting .mod() because we don't want any effects in the character building interface.
        const intelligence: number = this.get_Abilities('Intelligence')[0].baseValue(this.get_Character(), this.characterService, levelNumber).result;
        const INT: number = Math.floor((intelligence - 10) / 2);
        return INT;
    }

    get_SkillINTBonus(choice: SkillChoice, levelNumber: number) {
        //Allow INT more skills if INT has been raised since the last level.
        if (choice.source == 'Intelligence') {
            return this.get_INT(levelNumber) - this.get_INT(levelNumber - 1);
        } else {
            return 0;
        }
    }

    get_SkillChoices(level: Level) {
        return level.skillChoices.filter(choice => !choice.showOnSheet && (choice.available + this.get_SkillINTBonus(choice, level.number) > 0));
    }

    get_FeatChoices(level: Level, specialChoices: boolean = undefined) {
        const ancestry = this.get_Character().class.ancestry?.name || '';
        return level.featChoices.filter(choice =>
            choice.available &&
            (ancestry || choice.type != 'Ancestry') &&
            !choice.showOnSheet &&
            !choice.showOnCurrentLevel &&
            (specialChoices == undefined || choice.specialChoice == specialChoices)
        ).concat(this.get_FeatChoicesShownOnCurrentLevel(level, specialChoices));
    }

    get_FeatChoicesShownOnCurrentLevel(level: Level, specialChoices: boolean = undefined) {
        const ancestry = this.get_Character().class.ancestry?.name || '';
        if (this.get_Character().level == level.number) {
            const choices: FeatChoice[] = [];
            this.get_Character().class.levels.forEach(level => {
                choices.push(...level.featChoices
                    .filter(choice =>
                        (ancestry || choice.type != 'Ancestry') &&
                        !choice.showOnSheet &&
                        choice.showOnCurrentLevel &&
                        (specialChoices == undefined || choice.specialChoice == specialChoices)
                    )
                );
            });
            return choices;
        } else {
            return [];
        }
    }

    onLoreChange(checkedEvent: Event, choice: LoreChoice) {
        const checked = (<HTMLInputElement>checkedEvent.target).checked;
        if (checked) {
            if (this.get_Character().settings.autoCloseChoices && (choice.increases.length == choice.available - 1)) { this.toggle_List(''); }
            this.get_Character().add_Lore(this.characterService, choice);
        } else {
            this.get_Character().remove_Lore(this.characterService, choice);
        }
        this.refreshService.process_ToChange();
    }

    onLoreNameChange() {
        this.refreshService.set_ToChange('Character', 'charactersheet');
        this.refreshService.process_ToChange();
    }

    get_Feats(name = '', type = '') {
        return this.featsService.get_Feats(this.get_Character().customFeats, name, type);
    }

    get_CharacterFeatsAndFeatures(name = '', type = '') {
        return this.featsService.get_CharacterFeats(this.get_Character().customFeats, name, type);
    }

    get_Activities(name = '') {
        return this.activitiesService.get_Activities(name);
    }

    get_Spells(name = '') {
        return this.spellsService.get_Spells(name);
    }

    get_SpellLevel(levelNumber: number) {
        return Math.ceil(levelNumber / 2);
    }

    get_DifferentWorldsData(levelNumber: number): FeatData[] {
        if (this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber, 'Different Worlds').length) {
            return this.get_Character().class.get_FeatData(levelNumber, levelNumber, 'Different Worlds');
        }
    }

    get_BlessedBloodAvailable(levelNumber: number) {
        return this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber, 'Blessed Blood').length;
    }

    get_BlessedBloodDeitySpells() {
        const deity = this.characterService.get_CharacterDeities(this.get_Character())[0];
        if (deity) {
            return deity.clericSpells.map(spell => this.get_Spells(spell.name)[0]).filter(spell => spell && (this.get_Character().settings.showOtherOptions ? true : this.get_BlessedBloodHaveSpell(spell)));
        }
    }

    get_BlessedBloodSpells() {
        return this.get_Character().get_SpellListSpell('', 'Feat: Blessed Blood').length;
    }

    get_BlessedBloodHaveSpell(spell: Spell) {
        return this.get_Character().get_SpellListSpell(spell.name, 'Feat: Blessed Blood').length;
    }

    onBlessedBloodSpellTaken(spell: Spell, levelNumber: number, checkedEvent: Event) {
        const checked = (<HTMLInputElement>checkedEvent.target).checked;
        if (checked) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(''); }
            this.get_Character().add_SpellListSpell(spell.name, 'Feat: Blessed Blood', levelNumber);
        } else {
            this.get_Character().remove_SpellListSpell(spell.name, 'Feat: Blessed Blood', levelNumber);
        }
        this.refreshService.set_ToChange('Character', 'spells');
        this.refreshService.process_ToChange();
    }

    get_SplinterFaithAvailable(levelNumber: number) {
        return this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber, 'Splinter Faith').length;
    }

    get_SplinterFaithDomains() {
        return this.get_Character().class.get_FeatData(0, 0, 'Splinter Faith')[0]?.valueAsStringArray('domains') || [];
    }

    set_SplinterFaithDomains(domains: string[]) {
        this.get_Character().class.get_FeatData(0, 0, 'Splinter Faith')[0].setValue('domains', domains);
    }

    get_SplinterFaithAvailableDomains() {
        const deityName = this.get_Character().class.deity;
        if (deityName) {
            const deity = this.characterService.get_Deities(deityName)[0];
            if (deity) {
                return []
                    .concat(deity.domains.map((domain, index) => { return { title: index ? '' : 'Deity\'s Domains', type: 1, domain: this.deitiesService.get_Domains(domain)[0] || new Domain() }; }))
                    .concat(deity.alternateDomains.map((domain, index) => { return { title: index ? '' : 'Deity\'s Alternate Domains', type: 2, domain: this.deitiesService.get_Domains(domain)[0] || new Domain() }; }))
                    .concat(this.deitiesService.get_Domains().filter(domain => !deity.domains.includes(domain.name) && !deity.alternateDomains.includes(domain.name)).map((domain, index) => { return { title: index ? '' : 'Other Domains', type: 3, domain }; })) as
                    { title: string, type: number, domain: Domain }[];
            }
        }
        return [];
    }

    get_SplinterFaithThirdDomainTaken(availableDomains: { title: string, type: number, domain: Domain }[], takenDomains: string[]) {
        //Check if any domain with type 3 is among the taken domains.
        return availableDomains.some(availableDomain => availableDomain.type == 3 && takenDomains.includes(availableDomain.domain.name));
    }

    onSplinterFaithDomainTaken(domain: string, checkedEvent: Event) {
        const checked = (<HTMLInputElement>checkedEvent.target).checked;
        let domains = this.get_SplinterFaithDomains();
        if (domains) {
            if (checked) {
                domains.push(domain);
                const deityName = this.get_Character().class.deity;
                if (deityName) {
                    const deity = this.characterService.get_Deities(deityName)[0];
                    if (deity) {
                        deity.clear_TemporaryDomains();
                    }
                }
            } else {
                domains = domains.filter(takenDomain => takenDomain != domain);
                this.set_SplinterFaithDomains(domains);
                const deityName = this.get_Character().class.deity;
                if (deityName) {
                    const deity = this.characterService.get_Deities(deityName)[0];
                    if (deity) {
                        deity.clear_TemporaryDomains();
                    }
                }
            }
            this.refreshService.set_ToChange('Character', 'general');
            this.refreshService.process_ToChange();
        }
    }

    get_AdditionalHeritagesAvailable(levelNumber: number): HeritageGain[] {
        //Return all heritages you have gained on this specific level.
        return []
            .concat(
                ...this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber)
                    .map(taken => this.get_CharacterFeatsAndFeatures(taken.name)[0])
                    .filter(feat =>
                        feat &&
                        feat.gainHeritage.length
                    )
                    .map(feat => feat.gainHeritage)
            );
    }

    get_AdditionalHeritageIndex(source: string, level: number) {
        const oldHeritage = this.get_Character().class.additionalHeritages.find(heritage => heritage.source == source && heritage.charLevelAvailable == level);
        if (oldHeritage) {
            return [this.get_Character().class.additionalHeritages.indexOf(oldHeritage)];
        } else {
            return [this.get_Character().class.additionalHeritages.length];
        }
    }

    onAdditionalHeritageChange(heritage: Heritage, checkedEvent: Event, index: number) {
        const checked = (<HTMLInputElement>checkedEvent.target).checked;
        if (checked) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(''); }
            this.characterService.change_Heritage(heritage, index);
        } else {
            this.characterService.change_Heritage(new Heritage(), index);
        }
        this.refreshService.set_ToChange('Character', 'all');
        this.refreshService.process_ToChange();
    }

    onDifferentWorldsBackgroundChange(levelNumber: number, data: FeatData, background: Background, checkedEvent: Event) {
        const checked = (<HTMLInputElement>checkedEvent.target).checked;
        const character = this.get_Character();
        const level = character.class.levels[levelNumber];
        this.refreshService.set_ToChange('Character', 'general');
        if (checked) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(''); }
            data.setValue('background', background.name);
            background.loreChoices.forEach(choice => {
                const newChoice: LoreChoice = character.add_LoreChoice(level, choice);
                newChoice.source = 'Different Worlds';
                if (newChoice.loreName) {
                    if (this.get_Skills(`Lore: ${ newChoice.loreName }`, {}, { noSubstitutions: true }).length) {
                        const increases = character.get_SkillIncreases(this.characterService, 1, 20, `Lore: ${ newChoice.loreName }`).filter(increase =>
                            increase.sourceId.includes('-Lore-')
                        );
                        if (increases.length) {
                            const oldChoice = character.get_LoreChoice(increases[0].sourceId);
                            if (oldChoice.available == 1) {
                                character.remove_Lore(this.characterService, oldChoice);
                            }
                        }
                    }
                    character.add_Lore(this.characterService, newChoice);
                }
            });
        } else {
            data.setValue('background', '');
            const oldChoices: LoreChoice[] = level.loreChoices.filter(choice => choice.source == 'Different Worlds');
            //Remove the lore granted by Different Worlds.
            if (oldChoices.length) {
                const oldChoice = oldChoices[0];
                if (oldChoice.increases.length) {
                    character.remove_Lore(this.characterService, oldChoice);
                }
                level.loreChoices = level.loreChoices.filter(choice => choice.source != 'Different Worlds');
            }
        }
        this.refreshService.process_ToChange();
    }

    get_FuseStanceData(levelNumber: number): FeatData[] {
        if (this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber, 'Fuse Stance').length) {
            return this.get_Character().class.get_FeatData(levelNumber, levelNumber, 'Fuse Stance');
        }
    }

    get_StancesToFuse(levelNumber: number, fuseStanceData: FeatData): { activity: Activity, restricted: boolean, reason: string }[] {
        //Return all stances that you own.
        //Since Fuse Stance can't use two stances that only allow one type of attack each, we check if one of the previously selected stances does that,
        // and if so, make a note for each available stance with a restriction that it isn't available.
        const showOtherOptions = this.get_Character().settings.showOtherOptions;
        const unique: string[] = [];
        const availableStances: { activity: Activity, restricted: boolean, reason: string }[] = [];
        const restrictedConditions = this.get_Conditions().filter(condition => condition.attackRestrictions.length).map(condition => condition.name);
        const activities = this.activitiesService.get_Activities().filter(activity => activity.traits.includes('Stance'));
        const existingStances: Activity[] = [];
        const featStances = fuseStanceData.valueAsStringArray('stances');
        featStances.forEach(stance => {
            existingStances.push(activities.find(example => example.name == stance));
        });
        const anyRestrictedStances = existingStances.some(example => example.gainConditions.some(gain => restrictedConditions.includes(gain.name)));
        this.characterService.get_OwnedActivities(this.get_Character(), levelNumber)
            .map(activity => activities.find(example => example.name == activity.name))
            .filter(activity => activity && activity.name != 'Fused Stance')
            .forEach(activity => {
                if (!unique.includes(activity.name) && (showOtherOptions || featStances.length < 2 || featStances.includes(activity.name))) {
                    const restricted = activity.gainConditions.some(gain => restrictedConditions.includes(gain.name));
                    if (restricted && anyRestrictedStances && !featStances.includes(activity.name)) {
                        unique.push(activity.name);
                        availableStances.push({ activity, restricted, reason: 'Incompatible restrictions.' });
                    } else {
                        unique.push(activity.name);
                        availableStances.push({ activity, restricted, reason: '' });
                    }
                }
            });
        //Cleanup any stance that you don't have anymore at this point.
        const realStances = featStances.filter((existingStance: string) => availableStances.map(stance => stance.activity.name).includes(existingStance));
        fuseStanceData.setValue('stances', realStances);
        return availableStances;
    }

    onFuseStanceNameChange() {
        this.refreshService.set_ToChange('Character', 'activities');
        this.refreshService.process_ToChange();
    }

    onFuseStanceStanceChange(data: FeatData, stance: string, checkedEvent: Event) {
        const checked = (<HTMLInputElement>checkedEvent.target).checked;
        const stances = data.valueAsStringArray('stances');
        if (checked) {
            if (this.get_Character().settings.autoCloseChoices && stances.length == 1 && data.getValue('name')) { this.toggle_List(''); }
            stances.push(stance);
            data.setValue('stances', stances);
        } else {
            data.setValue('stances', stances.filter((existingStance: string) => existingStance != stance));
        }
        this.refreshService.set_ToChange('Character', 'activities');
        this.refreshService.process_ToChange();
    }

    get_SyncretismData(levelNumber: number) {
        if (this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber, 'Syncretism').length) {
            return this.get_Character().class.get_FeatData(levelNumber, levelNumber, 'Syncretism');
        }
    }

    onSyncretismDeityChange(data: FeatData, deity: Deity, checkedEvent: Event) {
        const checked = (<HTMLInputElement>checkedEvent.target).checked;
        if (checked) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(''); }
            data.setValue('deity', deity.name);
        } else {
            data.setValue('deity', '');
        }
        this.characterService.deitiesService.clear_CharacterDeities();
        this.refreshService.set_ToChange('Character', 'charactersheet');
        this.refreshService.set_ToChange('Character', 'featchoices');
        this.refreshService.set_ToChange('Character', 'general');
        this.refreshService.process_ToChange();
    }

    get_FeatsTaken(minLevelNumber: number, maxLevelNumber: number, featName = '', source = '', sourceId = '', locked: boolean = undefined, filter = '', automatic: boolean = undefined) {
        const character = this.get_Character();
        return this.characterService.get_CharacterFeatsTaken(minLevelNumber, maxLevelNumber, featName, source, sourceId, locked, undefined, undefined, automatic)
            .filter(taken =>
                !filter ||
                (filter == 'feature') == (taken.source == character.class.name || (taken.locked && taken.source.includes(' Dedication')))
            );
    }

    get_Classes(name = '') {
        return this.characterService.get_Classes(name);
    }

    get_AvailableClasses(): Class[] {
        const showOtherOptions = this.get_Character().settings.showOtherOptions;
        return this.get_Classes()
            .filter($class => showOtherOptions || !this.get_Character().class?.name || $class.name == this.get_Character().class.name)
            .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    onClassChange($class: Class, checkedEvent: Event) {
        const checked = (<HTMLInputElement>checkedEvent.target).checked;
        if (checked) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(''); }
            this.characterService.change_Class($class);
        } else {
            this.characterService.change_Class(new Class());
        }
    }

    get_Ancestries(name = '') {
        return this.historyService.get_Ancestries(name);
    }

    get_AvailableAncestries() {
        const showOtherOptions = this.get_Character().settings.showOtherOptions;
        return this.get_Ancestries()
            .filter(ancestry => showOtherOptions || !this.get_Character().class.ancestry?.name || ancestry.name == this.get_Character().class.ancestry.name)
            .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    onAncestryChange(ancestry: Ancestry, checkedEvent: Event) {
        const checked = (<HTMLInputElement>checkedEvent.target).checked;
        if (checked) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(''); }
            this.characterService.change_Ancestry(ancestry, this.itemsService);
        } else {
            this.characterService.change_Ancestry(new Ancestry(), this.itemsService);
        }
        this.refreshService.set_ToChange('Character', 'all');
        this.refreshService.process_ToChange();
    }

    get_AvailableDeities(name = '', syncretism = false, charLevel: number = this.get_Character().level) {
        const character = this.get_Character();
        const currentDeities = this.characterService.get_CharacterDeities(character, '', charLevel);
        const showOtherOptions = this.get_Character().settings.showOtherOptions;
        const wordFilter = this.deityWordFilter.toLowerCase();
        //Certain classes need to choose a deity allowing their alignment.
        return this.deitiesService.get_Deities(name).filter(deity =>
            (
                showOtherOptions ||
                (
                    syncretism ?
                        !currentDeities[1] :
                        !currentDeities[0]
                ) ||
                (
                    syncretism ?
                        ([currentDeities[0].name, currentDeities[1].name].includes(deity.name)) :
                        (deity.name == currentDeities[0].name)
                )
            ) &&
            (
                !character.class.deityFocused ||
                (
                    !this.get_Character().alignment ||
                    deity.followerAlignments.includes(this.get_Character().alignment)
                )
            ) && (
                !wordFilter || (
                    deity.name
                        .concat(
                            deity.desc,
                            deity.sourceBook,
                            ...deity.domains,
                            ...deity.alternateDomains,
                            ...deity.favoredWeapon
                        )
                        .toLowerCase()
                        .includes(wordFilter)
                )
            )
        ).sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    onDeityChange(deity: Deity, checkedEvent: Event) {
        const checked = (<HTMLInputElement>checkedEvent.target).checked;
        if (checked) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(''); }
            this.characterService.change_Deity(deity);
        } else {
            this.characterService.change_Deity(new Deity());
        }
        this.refreshService.process_ToChange();
    }

    get_Conditions(name = '') {
        return this.conditionsService.get_Conditions(name);
    }

    get_Heritages(name = '', ancestryName = '') {
        return this.historyService.get_Heritages(name, ancestryName);
    }

    get_SubHeritageNames(heritage: Heritage) {
        return heritage.subTypes.map(subheritage => subheritage.name);
    }

    get_AvailableHeritages(name = '', ancestryName = '', index = -1) {
        let heritage = this.get_Character().class.heritage;
        if (index != -1) {
            heritage = this.get_Character().class.additionalHeritages[index];
        }
        const showOtherOptions = this.get_Character().settings.showOtherOptions;
        return this.get_Heritages(name, ancestryName)
            .filter(availableHeritage =>
                showOtherOptions ||
                !heritage?.name ||
                availableHeritage.name == heritage.name ||
                availableHeritage.subTypes?.some(subType => subType.name == heritage.name)
            )
            .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    get_HaveHeritage(name = '') {
        return this.get_Character().class.heritage.name == name || this.get_Character().class.additionalHeritages.some(heritage => heritage.name == name);
    }

    onHeritageChange(heritage: Heritage, checkedEvent: Event) {
        const checked = (<HTMLInputElement>checkedEvent.target).checked;
        if (checked) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(''); }
            this.characterService.change_Heritage(heritage);
        } else {
            this.characterService.change_Heritage(new Heritage());
        }
        this.refreshService.set_ToChange('Character', 'all');
        this.refreshService.process_ToChange();
    }

    get_Backgrounds(name = '') {
        return this.historyService.get_Backgrounds(name).filter(background =>
            !background.subType &&
            (!this.adventureBackgrounds ? !background.adventurePath : true) &&
            (!this.regionalBackgrounds ? !background.region : true)
        );
    }

    get_AvailableBackgrounds() {
        const showOtherOptions = this.get_Character().settings.showOtherOptions;
        return this.get_Backgrounds()
            .filter(background =>
                showOtherOptions ||
                !this.get_Character().class.background?.name ||
                background.name == this.get_Character().class.background.name ||
                background.name == this.get_Character().class.background.superType
            ).sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    get_SubBackgrounds(superType = '') {
        return this.historyService.get_Backgrounds().filter(background => background.superType == superType);
    }

    get_SubBackgroundNames(superType: string) {
        return this.get_SubBackgrounds(superType).map(subbackground => subbackground.name);
    }

    onBackgroundChange(background: Background, checkedEvent: Event) {
        const checked = (<HTMLInputElement>checkedEvent.target).checked;
        if (checked) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(''); }
            this.characterService.change_Background(background);
        } else {
            this.characterService.change_Background(new Background());
        }
        this.refreshService.set_ToChange('Character', 'all');
        this.refreshService.process_ToChange();
    }

    get_CompanionAvailable(levelNumber: number) {
        //Return whether you have taken a feat this level that granted you an animal companion.
        return this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber)
            .map(taken => this.get_CharacterFeatsAndFeatures(taken.name)[0])
            .some(feat => feat && feat.gainAnimalCompanion == 'Young');
    }

    get_Companion() {
        return this.characterService.get_Character().class.animalCompanion;
    }

    onNewCompanion() {
        if (this.characterService.get_Character().class.animalCompanion) {
            const character = this.characterService.get_Character();
            //Keep the specializations and ID; When the animal companion is reset, any later feats and specializations still remain, and foreign effects still need to apply.
            const id = character.class.animalCompanion.id;
            const specializations: AnimalCompanionSpecialization[] = character.class.animalCompanion.class.specializations;
            character.class.animalCompanion = new AnimalCompanion();
            character.class.animalCompanion.class = new AnimalCompanionClass();
            if (id) { character.class.animalCompanion.id = id; }
            if (specializations.length) { character.class.animalCompanion.class.specializations = specializations; }
            this.characterService.initialize_AnimalCompanion();
            this.refreshService.process_ToChange();
        }
    }

    get_AvailableCompanionTypes() {
        const existingCompanionName: string = this.get_Companion().class.ancestry.name;
        const showOtherOptions = this.get_Character().settings.showOtherOptions;
        return this.animalCompanionsService.get_CompanionTypes()
            .filter(type => showOtherOptions || !existingCompanionName || type.name == existingCompanionName)
            .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    onCompanionTypeChange(type: AnimalCompanionAncestry, checkedEvent: Event) {
        const checked = (<HTMLInputElement>checkedEvent.target).checked;
        if (checked) {
            if (this.get_Character().settings.autoCloseChoices && this.get_Companion().name && this.get_Companion().species) { this.toggle_List(''); }
            this.get_Companion().class.on_ChangeAncestry(this.characterService);
            this.animalCompanionsService.change_Type(this.get_Companion(), type);
            this.get_Companion().class.on_NewAncestry(this.characterService, this.itemsService);
        } else {
            this.get_Companion().class.on_ChangeAncestry(this.characterService);
            this.animalCompanionsService.change_Type(this.get_Companion(), new AnimalCompanionAncestry());
        }
        this.refreshService.set_ToChange('Companion', 'all');
        this.cacheService.set_LevelChanged({ creatureTypeId: 1, minLevel: 0 });
        this.refreshService.process_ToChange();
    }

    onSpecializationChange(spec: AnimalCompanionSpecialization, checkedEvent: Event, levelNumber: number) {
        const checked = (<HTMLInputElement>checkedEvent.target).checked;
        if (checked) {
            if (this.get_Character().settings.autoCloseChoices && this.get_Companion().class.specializations.filter(spec => spec.level == levelNumber).length == this.get_CompanionSpecializationsAvailable(levelNumber) - 1) {
                this.toggle_List('');
            }
            this.animalCompanionsService.add_Specialization(this.get_Companion(), spec, levelNumber);
        } else {
            this.animalCompanionsService.remove_Specialization(this.get_Companion(), spec);
        }
        this.refreshService.set_ToChange('Companion', 'abilities');
        this.refreshService.set_ToChange('Companion', 'skills');
        this.refreshService.set_ToChange('Companion', 'attacks');
        this.refreshService.set_ToChange('Companion', 'defense');
        this.cacheService.set_LevelChanged({ creatureTypeId: 1, minLevel: 0 });
        this.refreshService.process_ToChange();
    }

    get_CompanionSpecializationsAvailable(levelNumber: number) {
        //Return how many feats you have taken this level that granted you an animal companion specialization.
        return this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber)
            .map(taken => this.get_CharacterFeatsAndFeatures(taken.name)[0])
            .filter(feat => feat && feat.gainAnimalCompanion == 'Specialized').length;
    }

    get_AvailableCompanionSpecializations(levelNumber: number) {
        const existingCompanionSpecs: AnimalCompanionSpecialization[] = this.get_Companion().class.specializations;
        const available = this.get_CompanionSpecializationsAvailable(levelNumber);
        const showOtherOptions = this.get_Character().settings.showOtherOptions;
        //Get all specializations that were either taken on this level (so they can be deselected) or that were not yet taken if the choice is not exhausted.
        return this.animalCompanionsService.get_CompanionSpecializations()
            .filter(type =>
                showOtherOptions ||
                existingCompanionSpecs.find(spec => spec.name == type.name && spec.level == levelNumber) ||
                (existingCompanionSpecs.filter(spec => spec.level == levelNumber).length < available) &&
                !existingCompanionSpecs.find(spec => spec.name == type.name)
            ).sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    get_TakenCompanionSpecializations(levelNumber: number) {
        return this.get_Companion().class.specializations.filter(spec => spec.level == levelNumber).map(spec => spec.name);
    }

    have_CompanionSpecialization(name: string) {
        return this.get_Companion().class.specializations.some(spec => spec.name == name);
    }

    get_FamiliarAvailable(levelNumber: number) {
        //Return whether you have taken a feat this level that granted you a familiar.
        return this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber)
            .map(taken => this.get_CharacterFeatsAndFeatures(taken.name)[0])
            .some(feat => feat && feat.gainFamiliar);
    }

    get_Familiar() {
        return this.characterService.get_Character().class.familiar;
    }

    onNewFamiliar() {
        if (this.get_Character().class.familiar) {
            const character = this.characterService.get_Character();
            //Preserve the origin class and set it again after resetting. Also preserve the ID so that old foreign effects still match.
            const originClass = character.class.familiar.originClass;
            const id = character.class.familiar.id;
            this.characterService.cleanup_Familiar();
            character.class.familiar = new Familiar();
            if (originClass) { character.class.familiar.originClass = originClass; }
            if (id) { character.class.familiar.id = id; }
            this.characterService.initialize_Familiar();
            this.refreshService.process_ToChange();
        }
    }

    onFamiliarSpeedChange(checkedEvent: Event) {
        const checked = (<HTMLInputElement>checkedEvent.target).checked;
        if (checked) {
            this.get_Familiar().speeds[1].name = 'Swim Speed';
        } else {
            this.get_Familiar().speeds[1].name = 'Land Speed';
        }
        this.refreshService.set_ToChange('Familiar', 'general');
        this.refreshService.set_ToChange('Familiar', 'familiarabilities');
        this.refreshService.process_ToChange();
    }

    is_FamiliarSwimmer() {
        return this.get_Familiar().speeds[1].name == 'Swim Speed';
    }

    get_ItemFromGain(gain: ItemGain) {
        //This is a simplified version of the methods in ItemGain. It doesn't work for "special" ItemGains, which aren't needed here.
        return this.characterService.get_CleanItems()[gain.type].filter((item: Item) => gain.get_IsMatchingItem(item));
    }

    get_AnimalCompanionAbilities(type: AnimalCompanionAncestry) {
        const abilities: [{ name: string, modifier: string }] = [{ name: '', modifier: '' }];
        this.characterService.get_Abilities().forEach(ability => {
            const name = ability.name.substr(0, 3);
            let modifier = 0;
            const classboosts = this.get_Companion().class.levels[1].abilityChoices[0].boosts.filter(boost => boost.name == ability.name);
            const ancestryboosts = type.abilityChoices[0].boosts.filter(boost => boost.name == ability.name);
            modifier = ancestryboosts.concat(classboosts).filter(boost => boost.type == 'Boost').length - ancestryboosts.concat(classboosts).filter(boost => boost.type == 'Flaw').length;
            abilities.push({ name, modifier: (modifier > 0 ? '+' : '') + modifier.toString() });
        });
        abilities.shift();
        return abilities;
    }

    add_BonusAbilityChoice(level: Level, type: 'Boost' | 'Flaw') {
        const newChoice = new AbilityChoice();
        newChoice.available = 1;
        newChoice.type = type;
        newChoice.source = this.bonusSource || 'Bonus';
        newChoice.bonus = true;
        this.get_Character().add_AbilityChoice(level, newChoice);
    }

    remove_BonusAbilityChoice(choice: AbilityChoice) {
        choice.boosts.forEach(boost => {
            this.get_Character().boost_Ability(this.characterService, boost.name, false, choice, false);
            this.refreshService.set_AbilityToChange('Character', boost.name, { characterService: this.characterService });
        });
        this.get_Character().remove_AbilityChoice(choice);
        this.toggle_List('');
        this.refreshService.process_ToChange();
    }

    add_BonusSkillChoice(level: Level, type: 'Perception' | 'Save' | 'Skill') {
        const newChoice = new SkillChoice();
        newChoice.available = 1;
        newChoice.type = type;
        newChoice.source = this.bonusSource || 'Bonus';
        newChoice.bonus = true;
        this.get_Character().add_SkillChoice(level, newChoice);
    }

    add_BonusFeatChoice(level: Level, type: 'Ancestry' | 'Class' | 'General' | 'Skill') {
        const newChoice = new FeatChoice();
        newChoice.available = 1;
        newChoice.type = type;
        newChoice.source = this.bonusSource || 'Bonus';
        newChoice.bonus = true;
        this.get_Character().add_FeatChoice(level, newChoice);
    }

    add_BonusLoreChoice(level: Level) {
        const newChoice = new LoreChoice();
        newChoice.available = 1;
        newChoice.source = this.bonusSource || 'Bonus';
        newChoice.bonus = true;
        this.get_Character().add_LoreChoice(level, newChoice);
    }

    remove_BonusLoreChoice(choice: LoreChoice, levelNumber: number) {
        const character = this.get_Character();
        const a = character.class.levels[levelNumber].loreChoices;
        if (choice.loreName) {
            character.remove_Lore(this.characterService, choice);
        }
        if (a.indexOf(choice) != -1) {
            a.splice(a.indexOf(choice), 1);
        }
        this.toggle_List('');
        this.refreshService.process_ToChange();
    }

    public still_loading(): boolean {
        return this.characterService.still_loading();
    }

    public ngOnInit(): void {
        //Start with the about page in desktop mode, and without it on mobile.
        this.showList = (window.innerWidth < 992) ? '' : 'about';
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe((target) => {
                if (['character', 'all', 'charactersheet'].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe((view) => {
                if (view.creature.toLowerCase() == 'character' && ['charactersheet', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
