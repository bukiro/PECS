import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CharacterService } from '../character.service';
import { ClassesService } from '../classes.service';
import { Class } from '../Class';
import { Level } from '../Level';
import { AbilitiesService } from '../abilities.service';
import { EffectsService } from '../effects.service';
import { FeatsService } from '../feats.service';
import { HistoryService } from '../history.service';
import { Ancestry } from '../Ancestry';
import { Heritage } from '../Heritage';
import { ItemsService } from '../items.service';
import { Background } from '../Background';
import { LoreChoice } from '../LoreChoice';
import { Ability } from '../Ability';
import { AbilityChoice } from '../AbilityChoice';
import { ActivitiesService } from '../activities.service';
import { Deity } from '../Deity';
import { DeitiesService } from '../deities.service';
import { SpellsService } from '../spells.service';
import { AnimalCompanionAncestry } from '../AnimalCompanionAncestry';
import { ItemGain } from '../ItemGain';
import { AnimalCompanion } from '../AnimalCompanion';
import { AnimalCompanionsService } from '../animalcompanions.service';
import { AnimalCompanionClass } from '../AnimalCompanionClass';
import { ConditionsService } from '../conditions.service';
import { AnimalCompanionSpecialization } from '../AnimalCompanionSpecialization';
import { Familiar } from '../Familiar';
import { SavegameService } from '../savegame.service';
import { Savegame } from '../Savegame';
import { TraitsService } from '../traits.service';
import { FamiliarsService } from '../familiars.service';
import { Item } from '../Item';
import { FeatChoice } from '../FeatChoice';
import { Spell } from '../Spell';
import { Character } from '../Character';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SkillChoice } from '../SkillChoice';
import { Activity } from '../Activity';
import { Domain } from '../Domain';
import { ConfigService } from '../config.service';
import { default as package_json } from 'package.json';
import { FeatData } from '../FeatData';
import { RefreshService } from '../refresh.service';

@Component({
    selector: 'app-character',
    templateUrl: './character.component.html',
    styleUrls: ['./character.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterComponent implements OnInit {

    public newClass: Class = new Class();
    private showLevel: number = 0;
    private showItem: string = "";
    private showList: string = "";
    private showContent: any | FeatChoice | SkillChoice | AbilityChoice = null;
    private showContentLevelNumber: number = 0;
    private showFixedChangesLevelNumber: number = 0;
    public adventureBackgrounds: boolean = true;
    public regionalBackgrounds: boolean = true;
    public deityWordFilter: string = "";
    public loadAsGM: boolean = false;
    public blankCharacter: Character = new Character();
    public bonusSource: string = "Bonus";
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
        private modalService: NgbModal,
        public modal: NgbActiveModal
    ) { }

    minimize() {
        this.characterService.get_Character().settings.characterMinimized = !this.characterService.get_Character().settings.characterMinimized;
    }

    get_Minimized() {
        return this.characterService.get_Character().settings.characterMinimized;
    }

    get_GMMode() {
        return this.characterService.get_GMMode();
    }

    toggleCharacterMenu() {
        this.characterService.toggle_Menu("character");
    }

    get_CharacterMenuState() {
        return this.characterService.get_CharacterMenuState();
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
            this.showItem = "";
        } else {
            this.showItem = name;
        }
    }

    toggle_List(name: string, levelNumber: number = 0, content: any = null) {
        //Set the currently shown list name, level number and content so that the correct choice with the correct data can be shown in the choice area.
        if (this.showList == name &&
            (!levelNumber || this.showContentLevelNumber == levelNumber) &&
            (!content || JSON.stringify(this.showContent) == JSON.stringify(content))) {
            this.showList = "";
            this.showContentLevelNumber = 0;
            this.showContent = null;
        } else {
            this.showList = name;
            this.showContentLevelNumber = levelNumber;
            this.showContent = content;
            this.reset_ChoiceArea();
        }
    }

    reset_ChoiceArea() {
        //Scroll up to the top of the choice area. This is only needed in desktop mode, where you can switch between choices without closing the first.
        if (this.characterService.get_Mobile()) {
            document.getElementById("character-choiceArea-top").scrollIntoView({ behavior: 'smooth' });
        }
    }

    receive_ChoiceMessage(message: { name: string, levelNumber: number, choice: SkillChoice }) {
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

    get_ActiveChoiceContent(choiceType: string = "") {
        //For choices that have a class of their own (AbilityChoice, SkillChoice, FeatChoice), get the currently shown content with levelNumber if it is of that same class.
        //Also get the currently shown list name for compatibility.
        if (this.showContent?.constructor.name == choiceType) {
            return [{ name: this.get_ShowList(), levelNumber: this.get_ShowContentLevelNumber(), choice: this.get_ShowContent() }];
        }
        return [];
    }

    get_ActiveSpecialChoiceShown(choiceType: string = "") {
        if (this.get_ShowList() == choiceType) {
            //For choices that don't have a class and can only show up once per level, get the currently shown list name with levelNumber if the list name matches the choice type.
            //Also get a "choice" object with a unique ID (the list name and the level number) for compatibility with TrackByID(), unless there is a current content with an id property.
            return [{ name: choiceType, levelNumber: this.get_ShowContentLevelNumber(), choice: this.get_ShowContent()?.id ? this.get_ShowContent() : { id: choiceType + this.get_ShowContentLevelNumber().toString() } }]
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
        this.refreshService.set_ToChange("Character", "featchoices");
        this.refreshService.set_ToChange("Character", "skillchoices");
        this.refreshService.process_ToChange();
    }

    get_TileMode() {
        return this.get_Character().settings.characterTileMode;
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    trackByID(index: number, obj: any): any {
        //Track ability, skiil or feat choices choices by id, so that when the selected choice changes, the choice area content is updated.
        // The choice area content is only ever one choice, so the index would always be 0.
        return obj.choice.id;
    }

    on_NewCharacter() {
        this.toggle_List("");
        this.characterService.reset_Character();
    }

    on_ManualMode() {
        //Manual mode changes some buttons on some components, so we need to refresh these.
        this.refreshService.set_ToChange("Character", "activities");
        this.refreshService.set_ToChange("Companion", "activities");
        this.refreshService.set_ToChange("Familiar", "activities");
        this.refreshService.set_ToChange("Character", "health");
        this.refreshService.set_ToChange("Companion", "health");
        this.refreshService.set_ToChange("Familiar", "health");
        this.refreshService.set_ToChange("Character", "inventory");
        this.refreshService.set_ToChange("Companion", "inventory");
        this.refreshService.set_ToChange("Character", "spellbook");
        this.refreshService.set_ToChange("Character", "top-bar");
        this.refreshService.process_ToChange();
    }

    on_RetryDatabaseConnection() {
        this.savegameService.initialize(this.characterService);
    }

    on_RetryLogin() {
        this.configService.get_Login("", this.characterService, this.savegameService);
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
            return this.savegameService.get_Savegames().sort(function (a, b) {
                if (a.name > b.name) {
                    return 1;
                }
                if (a.name < b.name) {
                    return -1;
                }
                return 0;
            }).sort(function (a, b) {
                if (a.partyName > b.partyName) {
                    return 1;
                }
                if (a.partyName < b.partyName) {
                    return -1;
                }
                return 0;
            }).sort(function (a, b) {
                if (b.partyName == "No Party" && a.partyName != "No Party") {
                    return 1;
                }
                if (a.partyName == "No Party" && b.partyName != "No Party") {
                    return -1;
                }
                return 0;
            });
        } else {
            return null;
        }
    }

    get_SavegameTitle(savegame: Savegame) {
        let title = "";
        if (savegame.heritage) {
            title += " | " + savegame.heritage;
            if (savegame.ancestry) {
                if (!savegame.heritage.includes(savegame.ancestry)) {
                    title += " " + savegame.ancestry;
                }
            }
        } else {
            if (savegame.ancestry) {
                title += " | " + savegame.ancestry;
            }
        }
        if (savegame.class) {
            title += " | ";
            if (savegame.classChoice) {
                title += savegame.classChoice + " ";
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
            if (result == "Ok click") {
                this.delete_CharacterFromDB(savegame);
            }
        }, (reason) => {
            //Do nothing if cancelled.
        });
    }

    get_FirstTime() {
        return this.characterService.get_FirstTime();
    }

    get_CloseButtonTitle() {
        if (this.get_FirstTime()) {
            return "Go to Character Sheet";
        } else {
            return "Back to Character Sheet";
        }
    }

    get_IsBlankCharacter() {
        return this.characterService.get_IsBlankCharacter();
    }

    get_Alignments() {
        let deity: Deity = this.get_Character().class?.deity ? this.deitiesService.get_Deities(this.get_Character().class.deity)[0] : null;
        let alignments = [
            "",
            "Lawful Good",
            "Neutral Good",
            "Chaotic Good",
            "Lawful Neutral",
            "Neutral",
            "Chaotic Neutral",
            "Lawful Evil",
            "Neutral Evil",
            "Chaotic Evil"
        ]
        //Certain classes need to pick an alignment matching their deity
        if (deity && this.get_Character().class.deityFocused) {
            return alignments.filter(alignment =>
                !deity.followerAlignments ||
                deity.followerAlignments.includes(alignment) ||
                alignment == ""
            )
        } else {
            return alignments;
        }

    }

    get_Level(number: number) {
        return this.get_Character().class.levels[number];
    }

    on_BaseValueChange() {
        let baseValues = this.get_Character().baseValues;
        if (baseValues.length) {
            baseValues.length = 0;
        } else {
            this.get_Abilities().forEach(ability => {
                baseValues.push({ name: ability.name, baseValue: 10 })
            });
            //Remove all Level 1 ability boosts that are now illegal
            if (this.get_Character().class.name) {
                this.get_Character().class.levels[1].abilityChoices.filter(choice => choice.available).forEach(choice => {
                    choice.boosts.length = Math.min(choice.available - choice.baseValuesLost, choice.boosts.length);
                });
            }
        }
        this.refreshService.set_ToChange("Character", "abilities");
        this.refreshService.set_ToChange("Character", "individualskills", "all");
        this.refreshService.set_ToChange("Character", "charactersheet");
        this.refreshService.process_ToChange();
    }

    on_AbilityChange(name: string) {
        this.refreshService.set_AbilityToChange("Character", name, { characterService: this.characterService });
    }

    set_Changed(target: string = "") {
        this.refreshService.set_Changed(target);
    }

    on_LanguageChange() {
        this.refreshService.set_ToChange("Character", "general");
        this.refreshService.set_ToChange("Character", "charactersheet");
        this.refreshService.process_ToChange();
    }

    on_NameChange() {
        this.refreshService.set_ToChange("Character", "general");
        this.refreshService.set_ToChange("Character", "top-bar");
        this.refreshService.process_ToChange();
    }

    on_AlignmentChange() {
        this.refreshService.set_ToChange("Character", "general");
        this.refreshService.set_ToChange("Character", "charactersheet");
        this.refreshService.set_ToChange("Character", "featchoices");
        this.refreshService.set_ToChange("Character", "effects");
        this.refreshService.process_ToChange();
    }

    on_HiddenFeatsChange() {
        this.refreshService.set_ToChange("Character", "charactersheet");
        this.refreshService.set_ToChange("Character", "featchoices");
        this.refreshService.process_ToChange();
    }

    numbersOnly(event): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    on_LevelUp() {
        let character = this.get_Character();
        let oldLevel = character.level;
        character.level += 1;
        character.experiencePoints -= 1000;
        this.on_LevelChange(oldLevel);
    }

    on_LevelChange(oldLevel: number) {
        let character = this.get_Character();
        let newLevel = character.level;
        //If we went up levels, repeat any onceEffects of Feats that apply inbetween, such as recovering Focus Points for a larger Focus Pool
        if (newLevel > oldLevel) {
            this.get_CharacterFeatsAndFeatures().filter(feat => feat.onceEffects.length && feat.have(character, this.characterService, newLevel, true, false, oldLevel + 1))
                .forEach(feat => {
                    feat.onceEffects.forEach(effect => {
                        this.characterService.process_OnceEffect(character, effect);
                    })
                })
        }

        //Find all the differences between the levels and refresh components accordingly.
        let lowerLevel = Math.min(oldLevel, newLevel);
        let higherLevel = Math.max(oldLevel, newLevel);

        character.class.levels.filter(level => level.number >= lowerLevel && level.number <= higherLevel).forEach(level => {
            level.featChoices.forEach(choice => {
                if (choice.showOnSheet) {
                    this.refreshService.set_ToChange("Character", "activities");
                }
            })
        })
        character.class.levels.forEach(level => {
            level.featChoices.forEach(choice => {
                if (choice.dynamicLevel) {
                    this.refreshService.set_ToChange("Character", "featchoices");
                }
            })
        })
        this.refreshService.set_ToChange("Character", "charactersheet");
        this.refreshService.set_ToChange("Character", "character-sheet");
        this.refreshService.set_ToChange("Character", "effects");
        this.refreshService.set_ToChange("Character", "top-bar");
        this.refreshService.set_ToChange("Character", "health");
        this.refreshService.set_ToChange("Character", "defense");
        this.refreshService.set_ToChange("Character", "attacks");
        this.refreshService.set_ToChange("Character", "general");
        this.refreshService.set_ToChange("Character", "individualskills", "all");
        this.refreshService.set_ToChange("Character", "individualspells", "all");
        this.refreshService.set_ToChange("Character", "activities");
        this.refreshService.set_ToChange("Character", "spells");
        this.refreshService.set_ToChange("Character", "spellbook");
        if (character.get_AbilityBoosts(lowerLevel, higherLevel).length) {
            this.refreshService.set_ToChange("Character", "abilities");
        }
        if (character.get_SkillIncreases(this.characterService, lowerLevel, higherLevel)) {
            this.refreshService.set_ToChange("Character", "skillchoices");
            this.refreshService.set_ToChange("Character", "skills");
        }
        this.get_CharacterFeatsAndFeatures().filter(feat => feat.have(character, this.characterService, higherLevel, true, false, lowerLevel))
            .forEach(feat => {
                this.refreshService.set_HintsToChange(character, feat.hints, { characterService: this.characterService });
                if (feat.gainAbilityChoice.length) {
                    this.refreshService.set_ToChange("Character", "abilities");
                }
                if (feat.gainSpellCasting.length || feat.gainSpellChoice.length) {
                    this.refreshService.set_ToChange("Character", "spellbook");
                } else if (feat.gainSpellChoice.length) {
                    this.refreshService.set_ToChange("Character", "spellbook");
                }
                if (feat.superType == "Adopted Ancestry") {
                    this.refreshService.set_ToChange("Character", "general");
                } else if (feat.name == "Different Worlds") {
                    this.refreshService.set_ToChange("Character", "general");
                }
            });
        //Reload spellbook if spells were learned between the levels
        if (character.get_SpellsLearned().some(learned => learned.level >= lowerLevel && learned.level <= higherLevel)) {
            this.refreshService.set_ToChange("Character", "spellbook");
            //if spells were taken between the levels
        } else if (character.get_SpellsTaken(this.characterService, lowerLevel, higherLevel).length) {
            this.refreshService.set_ToChange("Character", "spellbook");
            //if any spells have a dynamic level dependent on the character level
        } else if (character.get_SpellsTaken(this.characterService, 0, 20).some(taken => taken.choice.dynamicLevel.toLowerCase().includes("level"))) {
            this.refreshService.set_ToChange("Character", "spellbook");
            //or if you have the cantrip connection or spell battery familiar ability.
        } else if (this.characterService.get_FamiliarAvailable()) {
            this.refreshService.set_ToChange("Familiar", "all");
            this.get_Familiar().abilities.feats.map(gain => this.familiarsService.get_FamiliarAbilities(gain.name)[0]).filter(feat => feat).forEach(feat => {
                if (feat.name == "Cantrip Connection") {
                    this.refreshService.set_ToChange("Character", "spellbook");
                }
                if (feat.name == "Spell Battery") {
                    this.refreshService.set_ToChange("Character", "spellbook");
                }
            })
        }
        if (this.characterService.get_CompanionAvailable()) {
            this.get_Companion().set_Level(this.characterService);
        }
        if (this.characterService.get_FamiliarAvailable(newLevel)) {
            this.refreshService.set_ToChange("Familiar", "featchoices");
        }

        this.refreshService.process_ToChange();
    }

    on_UpdateSkills() {
        this.refreshService.set_ToChange("Character", "skills");
        this.refreshService.process_ToChange();
    }

    on_UpdateSpellbook() {
        this.refreshService.set_ToChange("Character", "spellbook");
        this.refreshService.process_ToChange();
    }

    get_LanguagesAvailable(levelNumber: number = 0) {
        let character = this.get_Character()
        if (character.class.ancestry.name) {
            if (levelNumber) {
                //If level is given, check if any new languages have been added on this level. If not, don't get any languages at this point.
                let newLanguages: number = 0;
                newLanguages += this.get_CharacterFeatsAndFeatures().filter(feat => feat.effects.some(effect => effect.affected == "Max Languages") && feat.have(character, this.characterService, levelNumber, false, false, levelNumber)).length
                newLanguages += character.get_AbilityBoosts(levelNumber, levelNumber, "Intelligence").length;
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
        let maxAvailable = this.get_MaxAvailable(choice);
        let title = "Ability " + (choice.infoOnly ? "Choice (no Boost)" : choice.type);
        if (maxAvailable > 1) {
            title += "s";
        }
        title += " (" + choice.source + ")";
        if (maxAvailable > 1) {
            title += ": " + choice.boosts.length + "/" + maxAvailable;
        } else {
            if (choice.boosts.length) {
                title += ": " + choice.boosts[0].name;
            }
        }
        return title;
    }

    get_AbilityTakenByThis(ability: Ability, choice: AbilityChoice, levelNumber: number) {
        return this.get_AbilityBoosts(levelNumber, levelNumber, ability.name, (choice.infoOnly ? 'Info' : choice.type), choice.source).length
    }

    get_Abilities(name: string = "") {
        return this.characterService.get_Abilities(name)
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
                abilities = abilities.filter(ability => choice.filter.includes(ability.name) || this.abilityBoostedByThis(ability, choice))
            }
        }
        let showOtherOptions = this.get_Character().settings.showOtherOptions;
        if (abilities.length) {
            return abilities.filter(ability => (
                showOtherOptions ||
                this.abilityBoostedByThis(ability, choice) ||
                (choice.boosts.length < choice.available - ((this.get_Character().baseValues.length > 0) ? choice.baseValuesLost : 0))
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
        if (choice.infoOnly) { return [] };
        let reasons: string[] = [];
        let sameBoostsThisLevel = this.get_AbilityBoosts(levelNumber, levelNumber, ability.name, choice.type, choice.source).filter(boost => boost.source == choice.source);
        if (sameBoostsThisLevel.length > 0) {
            //The ability may have been boosted by the same source, but as a fixed rule (e.g. fixed ancestry boosts vs. free ancestry boosts).
            //This does not apply to flaws - you can boost a flawed ability.
            if (sameBoostsThisLevel[0].locked) {
                let locked = "Fixed boost by " + sameBoostsThisLevel[0].source + ".";
                reasons.push(locked);
            } else
                //If an ability has been raised by a source of the same name, but not the same id, it cannot be raised again.
                //This is the case with backgrounds: You get a choice of two abilities, and then a free one.
                if (sameBoostsThisLevel[0].sourceId != choice.id) {
                    let exclusive = "Boosted by " + sameBoostsThisLevel[0].source + ".";
                    reasons.push(exclusive);
                }
        }
        //On level 1, boosts are not allowed to raise the ability above 18.
        //This is only relevant if you haven't boosted the ability on this level yet.
        //If you have, we don't want to hear that it couldn't be boosted again right away.
        let cannotBoostHigher = "";
        if (choice.type == "Boost" && levelNumber == 1 && ability.baseValue(this.get_Character(), this.characterService, levelNumber).result > 16 && sameBoostsThisLevel.length == 0) {
            cannotBoostHigher = "Cannot boost above 18 on level 1.";
            reasons.push(cannotBoostHigher);
        }
        return reasons;
    }

    abilityBoostedByThis(ability: Ability, choice: AbilityChoice) {
        return choice.boosts.filter(boost => ["Boost", "Info"].includes(boost.type) && boost.name == ability.name).length
    }

    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName: string = "", type: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined) {
        return this.get_Character().get_AbilityBoosts(minLevelNumber, maxLevelNumber, abilityName, type, source, sourceId, locked);
    }

    on_AbilityBoost(abilityName: string, boost: boolean, choice: AbilityChoice, locked: boolean) {
        if (boost && this.get_Character().settings.autoCloseChoices && choice.boosts.length == choice.available - ((this.get_Character().baseValues.length > 0) ? choice.baseValuesLost : 0) - 1) { this.toggle_List(""); }
        this.get_Character().boost_Ability(this.characterService, abilityName, boost, choice, locked);
        this.refreshService.set_AbilityToChange("Character", abilityName, { characterService: this.characterService });
        this.refreshService.process_ToChange();
    }

    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skillName: string, source: string = "", sourceId: string = "", locked: boolean = undefined) {
        return this.get_Character().get_SkillIncreases(this.characterService, minLevelNumber, maxLevelNumber, skillName, source, sourceId, locked);
    }

    get_Skills(name: string = "", type: string = "", locked: boolean = undefined) {
        return this.characterService.get_Skills(this.get_Character(), name, type, locked)
    }

    size(size: number) {
        switch (size) {
            case -1:
                return "Small";
            case 0:
                return "Medium";
            case 1:
                return "Large";
        }
    }

    get_INT(levelNumber: number) {
        if (!levelNumber) {
            return 0;
        }
        //We have to calculate the modifier instead of getting .mod() because we don't want any effects in the character building interface.
        let intelligence: number = this.get_Abilities("Intelligence")[0].baseValue(this.get_Character(), this.characterService, levelNumber).result;
        let INT: number = Math.floor((intelligence - 10) / 2);
        return INT;
    }

    get_SkillINTBonus(choice: SkillChoice, levelNumber: number) {
        //Allow INT more skills if INT has been raised since the last level.
        if (choice.source == "Intelligence") {
            return this.get_INT(levelNumber) - this.get_INT(levelNumber - 1);
        } else {
            return 0;
        }
    }

    get_SkillChoices(level: Level) {
        return level.skillChoices.filter(choice => !choice.showOnSheet && (choice.available + this.get_SkillINTBonus(choice, level.number) > 0))
    }

    get_FeatChoices(level: Level, specialChoices: boolean = undefined) {
        let ancestry = this.get_Character().class.ancestry?.name || "";
        return level.featChoices.filter(choice =>
            choice.available &&
            (ancestry || choice.type != "Ancestry") &&
            !choice.showOnSheet &&
            !choice.showOnCurrentLevel &&
            (specialChoices == undefined || choice.specialChoice == specialChoices)
        ).concat(this.get_FeatChoicesShownOnCurrentLevel(level, specialChoices));
    }

    get_FeatChoicesShownOnCurrentLevel(level: Level, specialChoices: boolean = undefined) {
        let ancestry = this.get_Character().class.ancestry?.name || "";
        if (this.get_Character().level == level.number) {
            let choices: FeatChoice[] = []
            this.get_Character().class.levels.forEach(level => {
                choices.push(...level.featChoices
                    .filter(choice =>
                        (ancestry || choice.type != "Ancestry") &&
                        !choice.showOnSheet &&
                        choice.showOnCurrentLevel &&
                        (specialChoices == undefined || choice.specialChoice == specialChoices)
                    )
                );
            })
            return choices;
        } else {
            return [];
        }
    }

    on_LoreChange(boost: boolean, choice: LoreChoice) {
        if (boost) {
            if (this.get_Character().settings.autoCloseChoices && (choice.increases.length == choice.available - 1)) { this.toggle_List(""); }
            this.get_Character().add_Lore(this.characterService, choice);
        } else {
            this.get_Character().remove_Lore(this.characterService, choice);
        }
        this.refreshService.process_ToChange();
    }

    on_LoreNameChange() {
        this.refreshService.set_ToChange("Character", "charactersheet");
        this.refreshService.process_ToChange();
    }

    get_Feats(name: string = "", type: string = "") {
        return this.featsService.get_Feats(this.get_Character().customFeats, name, type);
    }

    get_CharacterFeatsAndFeatures(name: string = "", type: string = "") {
        return this.featsService.get_CharacterFeats(this.get_Character().customFeats, name, type);
    }

    get_Activities(name: string = "") {
        return this.activitiesService.get_Activities(name);
    }

    get_Spells(name: string = "") {
        return this.spellsService.get_Spells(name);
    }

    get_SpellLevel(levelNumber: number) {
        return Math.ceil(levelNumber / 2);
    }

    get_DifferentWorldsData(levelNumber: number) {
        if (this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber, "Different Worlds").length) {
            return this.get_Character().class.get_FeatData(levelNumber, levelNumber, "Different Worlds");
        }
    }

    get_BlessedBloodAvailable(levelNumber: number) {
        return this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber, "Blessed Blood").length
    }

    get_BlessedBloodDeitySpells() {
        let deity = this.characterService.get_CharacterDeities(this.get_Character())[0];
        if (deity) {
            return deity.clericSpells.map(spell => this.get_Spells(spell.name)[0]).filter(spell => spell && (this.get_Character().settings.showOtherOptions ? true : this.get_BlessedBloodHaveSpell(spell)));
        }
    }

    get_BlessedBloodSpells() {
        return this.get_Character().get_SpellListSpell("", "Feat: Blessed Blood").length
    }

    get_BlessedBloodHaveSpell(spell: Spell) {
        return this.get_Character().get_SpellListSpell(spell.name, "Feat: Blessed Blood").length
    }

    on_BlessedBloodSpellTaken(spell: Spell, levelNumber: number, taken: boolean) {
        if (taken) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(""); }
            this.get_Character().add_SpellListSpell(spell.name, "Feat: Blessed Blood", levelNumber);
        } else {
            this.get_Character().remove_SpellListSpell(spell.name, "Feat: Blessed Blood", levelNumber);
        }
        this.refreshService.set_ToChange("Character", "spells");
        this.refreshService.process_ToChange();
    }

    get_SplinterFaithAvailable(levelNumber: number) {
        return this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber, "Splinter Faith").length;
    }

    get_SplinterFaithDomains() {
        return this.get_Character().class.get_FeatData(0, 0, "Splinter Faith")[0]?.data?.["domains"] || [];
    }

    get_SplinterFaithAvailableDomains() {
        let deityName = this.get_Character().class.deity;
        if (deityName) {
            let deity = this.characterService.get_Deities(deityName)[0];
            if (deity) {
                return []
                    .concat(deity.domains.map((domain, index) => { return { title: index ? "" : "Deity's Domains", type: 1, domain: this.deitiesService.get_Domains(domain)[0] || new Domain() } }))
                    .concat(deity.alternateDomains.map((domain, index) => { return { title: index ? "" : "Deity's Alternate Domains", type: 2, domain: this.deitiesService.get_Domains(domain)[0] || new Domain() } }))
                    .concat(this.deitiesService.get_Domains().filter(domain => !deity.domains.includes(domain.name) && !deity.alternateDomains.includes(domain.name)).map((domain, index) => { return { title: index ? "" : "Other Domains", type: 3, domain: domain } })) as
                    { title: string, type: number, domain: Domain }[];
            }
        }
        return [];
    }

    get_SplinterFaithThirdDomainTaken(availableDomains: { title: string, type: number, domain: Domain }[], takenDomains: string[]) {
        //Check if any domain with type 3 is among the taken domains.
        return availableDomains.some(availableDomain => availableDomain.type == 3 && takenDomains.includes(availableDomain.domain.name));
    }

    on_SplinterFaithDomainTaken(domain: string, taken: boolean) {
        let featData = this.get_Character().class.get_FeatData(0, 0, "Splinter Faith")[0];
        if (featData?.data?.["domains"]) {
            if (taken) {
                featData.data["domains"].push(domain);
                let deityName = this.get_Character().class.deity;
                if (deityName) {
                    let deity = this.characterService.get_Deities(deityName)[0];
                    if (deity) {
                        deity.clear_TemporaryDomains();
                    }
                }
            } else {
                featData.data["domains"] = featData.data["domains"].filter(takenDomain => takenDomain != domain);
                let deityName = this.get_Character().class.deity;
                if (deityName) {
                    let deity = this.characterService.get_Deities(deityName)[0];
                    if (deity) {
                        deity.clear_TemporaryDomains();
                    }
                }
            }
            this.refreshService.set_ToChange("Character", "general");
            this.refreshService.process_ToChange();
        }
    }

    get_AdditionalHeritagesAvailable(levelNumber: number) {
        //Return all heritages you have gained on this specific level.
        return this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber)
            .map(taken => this.get_CharacterFeatsAndFeatures(taken.name)[0])
            .filter(feat =>
                feat &&
                feat.gainHeritage.length
            )
            .map(feat => feat.gainHeritage)
    }

    get_AdditionalHeritageIndex(source: string) {
        let oldHeritage = this.get_Character().class.additionalHeritages.find(heritage => heritage.source == source);
        if (oldHeritage) {
            return [this.get_Character().class.additionalHeritages.indexOf(oldHeritage)];
        } else {
            return [this.get_Character().class.additionalHeritages.length]
        }
    }

    on_AdditionalHeritageChange(heritage: Heritage, taken: boolean, index: number, source: string) {
        if (taken) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(""); }
            this.characterService.change_Heritage(heritage, index, source);
        } else {
            this.characterService.change_Heritage(new Heritage(), index, source);
        }
        this.refreshService.set_ToChange("Character", "all");
        this.refreshService.process_ToChange();
    }

    on_DifferentWorldsBackgroundChange(levelNumber: number, data: FeatData, background: Background, taken: boolean) {
        let character = this.get_Character();
        let level = character.class.levels[levelNumber];
        if (taken) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(""); }
            data.data["background"] = background.name;
            background.loreChoices.forEach(choice => {
                let newChoice: LoreChoice = character.add_LoreChoice(level, choice);
                newChoice.source = "Different Worlds";
                if (newChoice.loreName) {
                    if (this.characterService.get_Skills(this.get_Character(), 'Lore: ' + newChoice.loreName).length) {
                        let increases = character.get_SkillIncreases(this.characterService, 1, 20, 'Lore: ' + newChoice.loreName).filter(increase =>
                            increase.sourceId.includes("-Lore-")
                        );
                        if (increases.length) {
                            let oldChoice = character.get_LoreChoice(increases[0].sourceId);
                            if (oldChoice.available == 1) {
                                character.remove_Lore(this.characterService, oldChoice);
                            }
                        }
                    }
                    character.add_Lore(this.characterService, newChoice);
                }
            })
        } else {
            data.data["background"] = "";
            let oldChoices: LoreChoice[] = level.loreChoices.filter(choice => choice.source == "Different Worlds");
            //Remove the lore granted by Different Worlds.
            if (oldChoices.length) {
                let oldChoice = oldChoices[0];
                if (oldChoice.increases.length) {
                    character.remove_Lore(this.characterService, oldChoice);
                }
                level.loreChoices = level.loreChoices.filter(choice => choice.source != "Different Worlds");
            }
        }
    }

    get_FuseStanceData(levelNumber: number) {
        if (this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber, "Fuse Stance").length) {
            return this.get_Character().class.get_FeatData(levelNumber, levelNumber, "Fuse Stance");
        }
    }

    get_StancesToFuse(levelNumber: number, fuseStanceData: FeatData) {
        //Return all stances that you own.
        //Since Fuse Stance can't use two stances that only allow one type of attack each, we check if one of the previously selected stances does that,
        // and if so, make a note for each available stance with a restriction that it isn't available.
        let showOtherOptions = this.get_Character().settings.showOtherOptions;
        let unique: string[] = [];
        let stances: { activity: Activity, restricted: boolean, reason: string }[] = [];
        let restrictedConditions = this.get_Conditions().filter(condition => condition.attackRestrictions.length).map(condition => condition.name);
        let activities = this.activitiesService.get_Activities().filter(activity => activity.traits.includes("Stance"));
        let existingStances: Activity[] = [];
        (fuseStanceData.data["stances"] as string[]).forEach(stance => {
            existingStances.push(activities.find(example => example.name == stance));
        })
        let restrictedStances = existingStances.some(example => example.gainConditions.some(gain => restrictedConditions.includes(gain.name)));
        this.characterService.get_OwnedActivities(this.get_Character(), levelNumber)
            .map(activity => activities.find(example => example.name == activity.name))
            .filter(activity => activity && activity.name != "Fused Stance")
            .forEach(activity => {
                if (!unique.includes(activity.name) && (showOtherOptions || fuseStanceData.data["stances"].length < 2 || fuseStanceData.data["stances"].includes(activity.name))) {
                    let restricted = activity.gainConditions.some(gain => restrictedConditions.includes(gain.name));
                    if (restricted && restrictedStances && !fuseStanceData.data["stances"].includes(activity.name)) {
                        unique.push(activity.name);
                        stances.push({ activity: activity, restricted: restricted, reason: "Incompatible restrictions." });
                    } else {
                        unique.push(activity.name);
                        stances.push({ activity: activity, restricted: restricted, reason: "" });
                    }
                }
            });
        return stances;
    }

    on_FuseStanceNameChange() {
        this.refreshService.set_ToChange("Character", "activities");
        this.refreshService.process_ToChange();
    }

    on_FuseStanceStanceChange(data: FeatData, stance: string, taken: boolean) {
        if (taken) {
            if (this.get_Character().settings.autoCloseChoices && data.data["stances"].length == 1 && data.data["name"]) { this.toggle_List(""); }
            data.data["stances"].push(stance);
        } else {
            data.data["stances"] = data.data["stances"].filter((existingStance: string) => existingStance != stance);
        }
        this.refreshService.set_ToChange("Character", "activities");
        this.refreshService.process_ToChange();
    }

    get_SyncretismData(levelNumber: number) {
        if (this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber, "Syncretism").length) {
            return this.get_Character().class.get_FeatData(levelNumber, levelNumber, "Syncretism");
        }
    }

    on_SyncretismDeityChange(data: FeatData, deity: Deity, taken: boolean) {
        if (taken) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(""); }
            data.data["deity"] = deity.name;
        } else {
            data.data["deity"] = "";
        }
        this.characterService.deitiesService.clear_CharacterDeities();
        this.refreshService.set_ToChange("Character", "charactersheet");
        this.refreshService.set_ToChange("Character", "featchoices");
        this.refreshService.set_ToChange("Character", "general");
        this.refreshService.process_ToChange();
    }

    get_FeatsTaken(minLevelNumber: number, maxLevelNumber: number, featName: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined, filter: string = "", automatic: boolean = undefined) {
        let character = this.get_Character();
        return this.characterService.get_CharacterFeatsTaken(minLevelNumber, maxLevelNumber, featName, source, sourceId, locked, undefined, undefined, automatic)
            .filter(taken =>
                !filter ||
                (filter == "feature") == (taken.source == character.class.name || (taken.locked && taken.source.includes(" Dedication")))
            );
    }

    get_Classes(name: string = "") {
        return this.characterService.get_Classes(name);
    }

    get_AvailableClasses() {
        let showOtherOptions = this.get_Character().settings.showOtherOptions;
        return this.get_Classes()
            .filter($class => showOtherOptions || !this.get_Character().class?.name || $class.name == this.get_Character().class.name)
            .sort(function (a, b) {
                if (a.name > b.name) {
                    return 1;
                }
                if (a.name < b.name) {
                    return -1;
                }
                return 0;
            });
    }

    onClassChange($class: Class, taken: boolean) {
        if (taken) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(""); }
            this.characterService.change_Class($class);
        } else {
            this.characterService.change_Class(new Class());
        }
    }

    get_Ancestries(name: string = "") {
        return this.historyService.get_Ancestries(name);
    }

    get_AvailableAncestries() {
        let showOtherOptions = this.get_Character().settings.showOtherOptions;
        return this.get_Ancestries()
            .filter(ancestry => showOtherOptions || !this.get_Character().class.ancestry?.name || ancestry.name == this.get_Character().class.ancestry.name)
            .sort(function (a, b) {
                if (a.name > b.name) {
                    return 1;
                }
                if (a.name < b.name) {
                    return -1;
                }
                return 0;
            });
    }

    onAncestryChange(ancestry: Ancestry, taken: boolean) {
        if (taken) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(""); }
            this.characterService.change_Ancestry(ancestry, this.itemsService);
        } else {
            this.characterService.change_Ancestry(new Ancestry(), this.itemsService);
        }
        this.refreshService.set_ToChange("Character", "all");
        this.refreshService.process_ToChange();
    }

    get_AvailableDeities(name: string = "", syncretism: boolean = false) {
        let character = this.get_Character();
        let currentDeities = this.characterService.get_CharacterDeities(character);
        let showOtherOptions = this.get_Character().settings.showOtherOptions;
        let wordFilter = this.deityWordFilter.toLowerCase();
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
                !wordFilter ||
                (
                    deity.name.toLowerCase().includes(wordFilter) ||
                    deity.desc.toLowerCase().includes(wordFilter) ||
                    deity.domains.some(domain => domain.toLowerCase().includes(wordFilter)) ||
                    deity.alternateDomains.some(domain => domain.toLowerCase().includes(wordFilter))
                )
            )
        ).sort(function (a, b) {
            if (a.name > b.name) {
                return 1
            }
            if (a.name < b.name) {
                return -1
            }
            return 0
        });
    }

    on_DeityChange(deity: Deity, taken: boolean) {
        if (taken) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(""); }
            this.characterService.change_Deity(deity);
        } else {
            this.characterService.change_Deity(new Deity());
        }
        this.refreshService.process_ToChange();
    }

    get_Conditions(name: string = "") {
        return this.conditionsService.get_Conditions(name);
    }

    get_Heritages(name: string = "", ancestryName: string = "") {
        return this.historyService.get_Heritages(name, ancestryName);
    }

    get_SubHeritageNames(heritage: Heritage) {
        return heritage.subTypes.map(subheritage => subheritage.name);
    }

    get_AvailableHeritages(name: string = "", ancestryName: string = "", index: number = -1) {
        let heritage = this.get_Character().class.heritage;
        if (index != -1) {
            heritage = this.get_Character().class.additionalHeritages[index];
        }
        let showOtherOptions = this.get_Character().settings.showOtherOptions;
        return this.get_Heritages(name, ancestryName)
            .filter(availableHeritage =>
            (
                showOtherOptions ||
                !heritage?.name ||
                availableHeritage.name == heritage.name ||
                availableHeritage.subTypes?.some(subType => subType.name == heritage.name))
            )
            .sort(function (a, b) {
                if (a.name > b.name) {
                    return 1;
                }
                if (a.name < b.name) {
                    return -1;
                }
                return 0;
            });
    }

    get_HaveHeritage(name: string = "") {
        return this.get_Character().class.heritage.name == name || this.get_Character().class.additionalHeritages.some(heritage => heritage.name == name);
    }

    onHeritageChange(heritage: Heritage, taken: boolean) {
        if (taken) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(""); }
            this.characterService.change_Heritage(heritage);
        } else {
            this.characterService.change_Heritage(new Heritage());
        }
        this.refreshService.set_ToChange("Character", "all");
        this.refreshService.process_ToChange();
    }

    get_Backgrounds(name: string = "") {
        return this.historyService.get_Backgrounds(name).filter(background =>
            !background.subType &&
            (!this.adventureBackgrounds ? !background.adventurePath : true) &&
            (!this.regionalBackgrounds ? !background.region : true)
        );
    }

    get_AvailableBackgrounds() {
        let showOtherOptions = this.get_Character().settings.showOtherOptions;
        return this.get_Backgrounds().filter(background =>
            showOtherOptions ||
            !this.get_Character().class.background?.name ||
            background.name == this.get_Character().class.background.name ||
            background.name == this.get_Character().class.background.superType
        )
            .sort(function (a, b) {
                if (a.name > b.name) {
                    return 1;
                }
                if (a.name < b.name) {
                    return -1;
                }
                return 0;
            });
    }

    get_SubBackgrounds(superType: string = "") {
        return this.historyService.get_Backgrounds().filter(background => background.superType == superType);
    }

    get_SubBackgroundNames(superType: string) {
        return this.get_SubBackgrounds(superType).map(subbackground => subbackground.name);
    }

    onBackgroundChange(background: Background, taken: boolean) {
        if (taken) {
            if (this.get_Character().settings.autoCloseChoices) { this.toggle_List(""); }
            this.characterService.change_Background(background);
        } else {
            this.characterService.change_Background(new Background());
        }
        this.refreshService.set_ToChange("Character", "all");
        this.refreshService.process_ToChange();
    }

    get_CompanionAvailable(levelNumber: number) {
        //Return whether you have taken a feat this level that granted you an animal companion.
        return this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber)
            .map(taken => this.get_CharacterFeatsAndFeatures(taken.name)[0])
            .some(feat => feat && feat.gainAnimalCompanion == "Young");
    }

    get_Companion() {
        return this.characterService.get_Character().class.animalCompanion;
    }

    on_NewCompanion() {
        if (this.characterService.get_Character().class.animalCompanion) {
            let character = this.characterService.get_Character();
            character.class.animalCompanion = new AnimalCompanion();
            character.class.animalCompanion.class = new AnimalCompanionClass();
            this.characterService.initialize_AnimalCompanion();
            this.refreshService.process_ToChange();
        }
    }

    get_AvailableCompanionTypes() {
        let existingCompanionName: string = this.get_Companion().class.ancestry.name;
        let showOtherOptions = this.get_Character().settings.showOtherOptions;
        return this.animalCompanionsService.get_CompanionTypes()
            .filter(type => showOtherOptions || !existingCompanionName || type.name == existingCompanionName)
            .sort(function (a, b) {
                if (a.name > b.name) {
                    return 1;
                }
                if (a.name < b.name) {
                    return -1;
                }
                return 0;
            });
    }

    on_CompanionTypeChange(type: AnimalCompanionAncestry, taken: boolean) {
        if (taken) {
            if (this.get_Character().settings.autoCloseChoices && this.get_Companion().name && this.get_Companion().species) { this.toggle_List(""); }
            this.get_Companion().class.on_ChangeAncestry(this.characterService);
            this.animalCompanionsService.change_Type(this.get_Companion(), type);
            this.get_Companion().class.on_NewAncestry(this.characterService, this.itemsService);
        } else {
            this.get_Companion().class.on_ChangeAncestry(this.characterService);
            this.animalCompanionsService.change_Type(this.get_Companion(), new AnimalCompanionAncestry());
        }
        this.refreshService.set_ToChange("Companion", "all");
        this.refreshService.process_ToChange();
    }

    on_SpecializationChange(spec: AnimalCompanionSpecialization, taken: boolean, levelNumber: number) {
        if (taken) {
            if (this.get_Character().settings.autoCloseChoices && this.get_Companion().class.specializations.filter(spec => spec.level == levelNumber).length == this.get_CompanionSpecializationsAvailable(levelNumber) - 1) {
                this.toggle_List("");
            }
            this.animalCompanionsService.add_Specialization(this.get_Companion(), spec, levelNumber);
        } else {
            this.animalCompanionsService.remove_Specialization(this.get_Companion(), spec);
        }
        this.refreshService.set_ToChange("Companion", "abilities");
        this.refreshService.set_ToChange("Companion", "skills");
        this.refreshService.set_ToChange("Companion", "attacks");
        this.refreshService.set_ToChange("Companion", "defense");
        this.refreshService.process_ToChange();
    }

    get_CompanionSpecializationsAvailable(levelNumber: number) {
        //Return how many feats you have taken this level that granted you an animal companion specialization.
        return this.characterService.get_CharacterFeatsTaken(levelNumber, levelNumber)
            .map(taken => this.get_CharacterFeatsAndFeatures(taken.name)[0])
            .filter(feat => feat && feat.gainAnimalCompanion == "Specialized").length;
    }

    get_AvailableCompanionSpecializations(levelNumber: number) {
        let existingCompanionSpecs: AnimalCompanionSpecialization[] = this.get_Companion().class.specializations;
        let available = this.get_CompanionSpecializationsAvailable(levelNumber);
        let showOtherOptions = this.get_Character().settings.showOtherOptions;
        //Get all specializations that were either taken on this level (so they can be deselected) or that were not yet taken if the choice is not exhausted.
        return this.animalCompanionsService.get_CompanionSpecializations().filter(type =>
            showOtherOptions ||
            existingCompanionSpecs.find(spec => spec.name == type.name && spec.level == levelNumber) ||
            (existingCompanionSpecs.filter(spec => spec.level == levelNumber).length < available) &&
            !existingCompanionSpecs.find(spec => spec.name == type.name)
        )
            .sort(function (a, b) {
                if (a.name > b.name) {
                    return 1;
                }
                if (a.name < b.name) {
                    return -1;
                }
                return 0;
            });
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

    on_NewFamiliar() {
        if (this.get_Character().class.familiar) {
            let character = this.characterService.get_Character();
            //Preserve the origin class and set it again after resetting
            let originClass = character.class.familiar.originClass;
            this.characterService.cleanup_Familiar();
            character.class.familiar = new Familiar();
            character.class.familiar.originClass = originClass;
            this.characterService.initialize_Familiar();
            this.refreshService.process_ToChange();
        }
    }

    on_FamiliarSpeedChange(taken: boolean) {
        if (taken) {
            this.get_Familiar().speeds[1].name = "Swim Speed";
        } else {
            this.get_Familiar().speeds[1].name = "Land Speed";
        }
        this.refreshService.set_ToChange("Familiar", "general");
        this.refreshService.set_ToChange("Familiar", "familiarabilities");
        this.refreshService.process_ToChange();
    }

    is_FamiliarSwimmer() {
        return this.get_Familiar().speeds[1].name == "Swim Speed"
    }

    get_ItemFromGain(gain: ItemGain) {
        return this.characterService.get_CleanItems()[gain.type].filter((item: Item) => item.name.toLowerCase() == gain.name.toLowerCase());
    }

    get_AnimalCompanionAbilities(type: AnimalCompanionAncestry) {
        let abilities: [{ name: string, modifier: string }] = [{ name: "", modifier: "" }];
        this.characterService.get_Abilities().forEach(ability => {
            let name = ability.name.substr(0, 3);
            let modifier = 0;
            let classboosts = this.get_Companion().class.levels[1].abilityChoices[0].boosts.filter(boost => boost.name == ability.name)
            let ancestryboosts = type.abilityChoices[0].boosts.filter(boost => boost.name == ability.name);
            modifier = ancestryboosts.concat(classboosts).filter(boost => boost.type == "Boost").length - ancestryboosts.concat(classboosts).filter(boost => boost.type == "Flaw").length;
            abilities.push({ name: name, modifier: (modifier > 0 ? "+" : "") + modifier.toString() })
        })
        abilities.shift();
        return abilities;
    }

    add_BonusAbilityChoice(level: Level, type: "Boost" | "Flaw") {
        let newChoice = new AbilityChoice();
        newChoice.available = 1;
        newChoice.type = type;
        newChoice.source = this.bonusSource || "Bonus";
        newChoice.bonus = true;
        this.get_Character().add_AbilityChoice(level, newChoice);
    }

    remove_BonusAbilityChoice(choice: AbilityChoice) {
        choice.boosts.forEach(boost => {
            this.get_Character().boost_Ability(this.characterService, boost.name, false, choice, false);
            this.refreshService.set_AbilityToChange("Character", boost.name, { characterService: this.characterService });
        })
        this.get_Character().remove_AbilityChoice(choice);
        this.toggle_List("");
        this.refreshService.process_ToChange();
    }

    add_BonusSkillChoice(level: Level, type: "Perception" | "Save" | "Skill") {
        let newChoice = new SkillChoice();
        newChoice.available = 1;
        newChoice.type = type;
        newChoice.source = this.bonusSource || "Bonus";
        newChoice.bonus = true;
        this.get_Character().add_SkillChoice(level, newChoice);
    }

    add_BonusFeatChoice(level: Level, type: "Ancestry" | "Class" | "General" | "Skill") {
        let newChoice = new FeatChoice();
        newChoice.available = 1;
        newChoice.type = type;
        newChoice.source = this.bonusSource || "Bonus";
        newChoice.bonus = true;
        this.get_Character().add_FeatChoice(level, newChoice);
    }

    add_BonusLoreChoice(level: Level) {
        let newChoice = new LoreChoice();
        newChoice.available = 1;
        newChoice.source = this.bonusSource || "Bonus";
        newChoice.bonus = true;
        this.get_Character().add_LoreChoice(level, newChoice);
    }

    remove_BonusLoreChoice(choice: LoreChoice, levelNumber: number) {
        let character = this.get_Character();
        let a = character.class.levels[levelNumber].loreChoices;
        if (choice.loreName) {
            character.remove_Lore(this.characterService, choice);
        }
        if (a.indexOf(choice) != -1) {
            a.splice(a.indexOf(choice), 1);
        }
        this.toggle_List("");
        this.refreshService.process_ToChange();
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.refreshService.get_Changed
                .subscribe((target) => {
                    if (["character", "all", "charactersheet"].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == "character" && ["charactersheet", "all"].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        //Start with the about page in desktop mode, and without it on mobile.
        this.showList = (window.innerWidth < 992) ? "" : "about";
        this.finish_Loading();
    }

}
