import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SpellChoice } from 'src/app/SpellChoice';
import { SpellsService } from 'src/app/spells.service';
import { CharacterService } from 'src/app/character.service';
import { Spell } from 'src/app/Spell';
import { TraitsService } from 'src/app/traits.service';
import { SpellCasting } from 'src/app/SpellCasting';
import { EffectsService } from 'src/app/effects.service';
import { SpellGain } from 'src/app/SpellGain';
import { SpellLearned } from 'src/app/SpellLearned';
import { SignatureSpellGain } from 'src/app/SignatureSpellGain';
import { NgbPopoverConfig, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-spellchoice',
    templateUrl: './spellchoice.component.html',
    styleUrls: ['./spellchoice.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellchoiceComponent implements OnInit {

    @Input()
    spellCasting: SpellCasting = undefined;
    @Input()
    choice: SpellChoice
    @Input()
    showHeightened: boolean = false;
    @Input()
    allowBorrow: boolean = false;
    @Input()
    showChoice: string = "";
    @Input()
    showSpell: string = "";
    @Output()
    showChoiceMessage = new EventEmitter<{ name: string, levelNumber: number, choice: SpellChoice, casting: SpellCasting }>();
    @Output()
    showSpellMessage = new EventEmitter<string>();
    @Input()
    level: number;
    @Input()
    itemSpell: boolean = false;
    //Is the spell prepared after you choose it?
    @Input()
    prepared: boolean = false;
    @Input()
    showTitle: boolean = true;
    @Input()
    showContent: boolean = true;
    @Input()
    tileMode: boolean = false;
    //Are we choosing character spells from the spellbook/repertoire? If not, some functions will be disabled.
    @Input()
    spellbook: boolean = false;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private spellsService: SpellsService,
        private traitsService: TraitsService,
        private effectsService: EffectsService,
        popoverConfig: NgbPopoverConfig,
        tooltipConfig: NgbTooltipConfig
    ) {
        popoverConfig.autoClose = "outside";
        popoverConfig.container = "body";
        //For touch compatibility, this openDelay prevents the popover from closing immediately on tap because a tap counts as hover and then click;
        popoverConfig.openDelay = 50;
        popoverConfig.placement = "auto";
        popoverConfig.popoverClass = "list-item sublist";
        popoverConfig.triggers = "hover:click";
        tooltipConfig.container = "body";
        //For touch compatibility, this openDelay prevents the tooltip from closing immediately on tap because a tap counts as hover and then click;
        tooltipConfig.openDelay = 100;
        tooltipConfig.triggers = "hover:click";
    }

    toggle_Spell(name: string) {
        if (this.showSpell == name) {
            this.showSpell = "";
        } else {
            this.showSpell = name;
        }
        this.showSpellMessage.emit(this.showSpell)
    }

    toggle_Choice(name: string) {
        if (this.showChoice == name) {
            this.showChoice = "";
        } else {
            this.showChoice = name;
        }
        this.showChoiceMessage.emit({ name: name, levelNumber: this.level, choice: this.choice, casting: this.spellCasting })
    }

    get_ShowSpell() {
        return this.showSpell;
    }

    get_ShowChoice() {
        return this.showChoice;
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    trackBySpellID(index: number, obj: any): any {
        return obj.id;
    }

    get_TileMode() {
        return this.tileMode;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Level(number: number) {
        return this.get_Character().class.levels[number];
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.spellsService.get_Spells(name, type, tradition);
    }

    capitalize(text: string) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    get_ButtonTitle(available: number) {
        let title: string = "";
        if (this.itemSpell || this.choice.showOnSheet) {
            title += " Level " + this.choice.level;
        }
        if (this.choice.frequency) {
            title += " " + this.capitalize(this.choice.frequency);
        }
        if (this.choice.tradition) {
            title += " " + this.choice.tradition;
        }
        if (this.is_AdaptedCantripSpell()) {
            title += " non-" + this.spellCasting.tradition;
        }
        if (this.is_AdaptiveAdeptSpell()) {
            title += " non-" + this.spellCasting.tradition;
        }
        if (this.choice.traitFilter.length) {
            title += " " + this.choice.traitFilter.join(" ");
        }
        if (this.choice.spellCombinationAllowed) {
            title += " Combination";
        }
        if (this.choice.className) {
            title += " " + this.choice.className;
        }
        if (this.choice.spellBookOnly) {
            title += " Spellbook";
        }
        title += " Spell"
        if (available != 1) {
            title += "s";
        }
        if (!this.itemSpell) {
            title += " (" + this.choice.source + ")";
        }
        if (available != 1) {
            title += ": " + this.choice.spells.length + "/" + available;
        } else {
            if (this.choice.spells.length) {
                title += ": " + this.choice.spells[0].name;
                if (this.choice.spells[0].combinationSpellName) {
                    title += " & " + this.choice.spells[0].combinationSpellName;
                }
            }
        }
        return title;
    }

    get_SignatureSpellsAllowed() {
        if (
            this.spellCasting &&
            this.choice.level > 0 &&
            this.spellCasting?.castingType == "Spontaneous" &&
            this.choice.source.includes(this.spellCasting.className + " Spellcasting") &&
            !this.choice.showOnSheet
        ) {
            let signatureSpellGains: SignatureSpellGain[] = [];
            this.characterService.get_FeatsAndFeatures()
                .filter(feat => feat.allowSignatureSpells.length && feat.have(this.get_Character(), this.characterService)).forEach(feat => {
                    signatureSpellGains.push(...feat.allowSignatureSpells.filter(gain => gain.className == this.spellCasting.className))
                })
            if (signatureSpellGains.some(gain => gain.available == -1)) {
                return -1;
            } else {
                return signatureSpellGains.map(gain => gain.available).reduce((a, b) => a + b, 0);
            }
        } else {
            return 0;
        }
    }

    get_SignatureSpellsChosen(level: number = 0) {
        //This function is used to check if a signature spell has been assigned for this spell level and returns the allowed amount (-1 for unlimited).
        if (level == 0) {
            return this.spellCasting.spellChoices.filter(choice => choice.spells.some(gain => gain.signatureSpell)).length;
        } else {
            return this.spellCasting.spellChoices.filter(choice => choice.level == level && choice.spells.some(gain => gain.signatureSpell)).length;
        }
    }

    has_SignatureSpell(signatureSpellsAllowed: number) {
        return signatureSpellsAllowed && this.choice.spells.some(gain => gain.signatureSpell);
    }

    get_CannotChooseSignatureSpell(signatureSpellsAllowed: number, taken: SpellGain) {
        if (taken?.signatureSpell) {
            return "";
        } else {
            if (this.get_SignatureSpellsChosen(this.choice.level)) {
                return "A signature spell has already been chosen for this level.";
            }
            if ((signatureSpellsAllowed > -1 && this.get_SignatureSpellsChosen(0) >= signatureSpellsAllowed)) {
                return "The maximum amount of signature spells (" + signatureSpellsAllowed + ") has already been chosen.";
            }
            return "";
        }
    }

    on_SignatureSpell() {
        this.characterService.set_ToChange("Character", "spellchoices");
        this.characterService.set_ToChange("Character", "spellbook");
        this.characterService.process_ToChange();
    }

    have_Feat(name: string) {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level, name).length;
    }

    is_TradedIn() {
        //For all spell choices that you gain from trading in another one, identify them by their source here.
        // (Spell Blending, Adapted Cantrip, Infinite Possibilities, Spell Mastery, Spell Combination)
        return [
            "Spell Blending",
            "Feat: Adapted Cantrip",
            "Feat: Adaptive Adept: Cantrip",
            "Feat: Adaptive Adept: 1st-Level Spell",
            "Feat: Infinite Possibilities",
            "Feat: Spell Mastery"
        ].includes(this.choice.source) ||
            this.choice.spellCombination;
    }

    get_SpellBlendingAllowed() {
        //You can trade in a spell slot if:
        // - This choice is not a cantrip or focus spell and is above level 2
        // - This choice does not have a dynamic level
        // - This choice is part of prepared wizard spellcasting
        // - This choice is not itself a bonus slot gained by trading in (Spell Blending, Infinite Possibilities, Spell Mastery, Spell Combination)
        // - You have the Spell Blending feat
        return (this.choice.level > 0 && !this.choice.dynamicLevel && this.spellCasting.className == "Wizard" && this.spellCasting.castingType == "Prepared" &&
            !this.is_TradedIn() &&
            this.have_Feat("Spell Blending"));
    }

    get_SpellBlendingUsed() {
        //Return the amount of spell slots in this choice that have been traded in.
        return (this.choice.spellBlending.reduce((sum, current) => sum + current, 0));
    }

    on_SpellBlending(tradeLevel: number, value: number) {
        this.choice.spellBlending[tradeLevel] += value;
        this.characterService.set_Changed("spellchoices");
        this.characterService.process_ToChange();
    }

    get_SpellBlendingUnlocked(level: number) {
        //This function is used both to unlock the Spell Blending bonus spell slot (choice.source == "Spell Blending")
        //  and to check if the current choice can be traded in for a spell slot at the given level (get_SpellBlendingAllowed()).
        if (this.get_SpellBlendingAllowed() || this.choice.source == "Spell Blending") {
            let highestSpellLevel = this.get_HighestSpellLevel();
            //Check if there are enough spell choices that have been traded in in this spellcasting to unlock this level.
            if (level == 0) {
                return this.spellCasting.spellChoices.filter(choice => choice.level > 0 && choice.spellBlending[0] > 0).length * 2;
            } else if (level > 0 && level <= highestSpellLevel) {
                if (
                    (
                        this.spellCasting.spellChoices
                            .filter(choice => choice.level == level - 1 && choice.spellBlending[1] > 0)
                            .map(choice => choice.spellBlending[1])
                            .reduce((sum, current) => sum + current, 0) >= 2
                    ) ||
                    (
                        this.spellCasting.spellChoices
                            .filter(choice => choice.level == level - 2 && choice.spellBlending[2] > 0)
                            .map(choice => choice.spellBlending[2])
                            .reduce((sum, current) => sum + current, 0) >= 2
                    )
                ) {
                    return 1;
                } else {
                    return 0;
                }
            } else if (level > highestSpellLevel) {
                //If the targeted spell level is not available, return -1 so there is a result, but it does not grant any spells.
                return -1;
            }
        } else {
            return 0;
        }
    }

    get_InfinitePossibilitiesAllowed() {
        //You can trade in a spell slot if:
        // - This choice is not a cantrip or focus spell and is above level 2
        // - This choice does not have a dynamic level
        // - This choice is part of prepared wizard spellcasting
        // - This choice is not itself a bonus slot gained by trading in
        // - You have the Infinite Possibilities feat
        return (this.choice.level > 2 && !this.choice.dynamicLevel && this.spellCasting.className == "Wizard" && this.spellCasting.castingType == "Prepared" &&
            !this.is_TradedIn() &&
            this.have_Feat("Infinite Possibilities"));
    }

    get_InfinitePossibilitiesUsed() {
        //Return the amount of spell slots in this choice that have been traded in (so either 0 or 1).
        return (this.choice.infinitePossibilities ? 1 : 0);
    }

    on_InfinitePossibilities() {
        this.characterService.set_Changed("spellchoices");
        this.characterService.set_Changed("spellbook");
        this.characterService.process_ToChange();
    }

    get_InfinitePossibilitiesUnlocked(level: number = 0) {
        //This function is used both to unlock the Infinite Possibilities bonus spell slot (is_InfinitePossibilitiesSpell())
        //  and to check if the current choice can be traded in for a spell slot at the given level (get_InfinitePossibilitiesAllowed()).
        if (this.get_InfinitePossibilitiesAllowed() || this.is_InfinitePossibilitiesSpell()) {
            //Check if any spell slots have been traded in for IP (level == 0) or if the one on this level has been unlocked.
            if (level == 0) {
                return this.spellCasting.spellChoices.find(choice => choice.infinitePossibilities) ? 1 : 0;
            } else {
                return this.spellCasting.spellChoices.find(choice => choice.level == level + 2 && choice.infinitePossibilities) ? 1 : 0;
            }
        } else {
            return 0;
        }
    }

    is_InfinitePossibilitiesSpell() {
        return this.choice.source == "Feat: Infinite Possibilities";
    }

    get_AdaptedCantripAllowed() {
        //You can trade in a spell slot if:
        // - This choice is a cantrip
        // - This choice does not have a dynamic level
        // - This choice is part of your default spellcasting
        // - This choice is not itself a bonus slot gained by trading in
        // - You have the Adapted Cantrip feat
        return (this.choice.level == 0 && !this.choice.dynamicLevel && this.spellCasting === this.get_Character().get_DefaultSpellcasting() &&
            !this.is_TradedIn() &&
            this.have_Feat("Adapted Cantrip"));
    }

    get_AdaptedCantripUsed() {
        //Return the amount of spell slots in this choice that have been traded in (so either 0 or 1).
        return (this.choice.adaptedCantrip ? 1 : 0);
    }

    on_AdaptedCantrip() {
        this.characterService.set_Changed("spellchoices");
        this.characterService.set_Changed("spellbook");
        this.characterService.process_ToChange();
    }

    get_AdaptedCantripUnlocked() {
        //This function is used both to unlock the Adapted Cantrip bonus spell slot (is_AdaptedCantripSpell())
        //  and to check if the current choice can be traded in for a spell slot at the given level (get_AdaptedCantripAllowed()).
        if (this.get_AdaptedCantripAllowed() || this.is_AdaptedCantripSpell()) {
            //Check if any spell slots have been traded in for AC.
            return this.spellCasting.spellChoices.find(choice => choice.adaptedCantrip) ? 1 : 0;
        } else {
            return 0;
        }
    }

    is_AdaptedCantripSpell() {
        return this.choice.source == "Feat: Adapted Cantrip";
    }

    get_AdaptiveAdeptAllowed() {
        //You can trade in a spell slot if:
        // - This choice is a cantrip and you have the Adaptive Adept: Cantrip feat 
        //   OR this choice is 1st level and you have the Adaptive Adept: 1st-Level Spell feat 
        // - This choice does not have a dynamic level
        // - This choice is part of your default spellcasting
        // - This choice is not itself a bonus slot gained by trading in
        return (!this.choice.dynamicLevel && this.spellCasting === this.get_Character().get_DefaultSpellcasting() &&
            !this.is_TradedIn() &&
            (
                (this.choice.level == 0 && this.have_Feat("Adaptive Adept: Cantrip")) ||
                (this.choice.level == 1 && this.have_Feat("Adaptive Adept: 1st-Level Spell"))
            )
        );
    }

    get_AdaptiveAdeptUsed() {
        //Return the amount of spell slots in this choice that have been traded in (so either 0 or 1).
        return (this.choice.adaptiveAdept ? 1 : 0);
    }

    on_AdaptiveAdept() {
        this.characterService.set_Changed("spellchoices");
        this.characterService.set_Changed("spellbook");
        this.characterService.process_ToChange();
    }

    get_AdaptiveAdeptUnlocked() {
        //This function is used both to unlock the Adaptive Adept bonus spell slot (is_AdaptiveAdeptSpell())
        //  and to check if the current choice can be traded in for a spell slot at the given level (get_AdaptiveAdeptAllowed()).
        if (this.get_AdaptiveAdeptAllowed() || this.is_AdaptiveAdeptSpell()) {
            //Check if any spell slots have been traded in for AC.
            return this.spellCasting.spellChoices.find(choice => choice.adaptiveAdept) ? 1 : 0;
        } else {
            return 0;
        }
    }

    is_AdaptiveAdeptSpell() {
        return this.choice.source.includes("Feat: Adaptive Adept");
    }

    is_EsotericPolymathSpell(choice: SpellChoice) {
        return choice.source == "Feat: Esoteric Polymath";
    }

    get_EsotericPolymathAllowed(casting: SpellCasting, tradition: string) {
        if (casting.className == "Bard" && casting.castingType == "Spontaneous" && this.have_Feat("Esoteric Polymath")) {
            if (["", "Occult"].includes(tradition)) {
                return true;
            } else if (this.have_Feat("Impossible Polymath")) {
                let character = this.get_Character();
                let skill: string = "";
                switch (tradition) {
                    case "Arcane":
                        skill = "Arcana";
                        break;
                    case "Divine":
                        skill = "Religion";
                        break;
                    case "Primal":
                        skill = "Nature";
                        break;
                }
                return this.characterService.get_Skills(character, skill)[0].level(character, this.characterService, character.level) >= 2
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    is_ArcaneEvolutionSpell() {
        return this.choice.source == "Feat: Arcane Evolution";
    }

    is_OccultEvolutionSpell() {
        return this.choice.source == "Feat: Occult Evolution";
    }

    get_CrossbloodedEvolutionAllowed() {
        if (
            this.choice.level > 0 &&
            this.spellCasting?.className == "Sorcerer" &&
            this.spellCasting.castingType == "Spontaneous" &&
            this.have_Feat("Crossblooded Evolution") &&
            this.choice.source.includes("Sorcerer Spellcasting") &&
            !this.choice.showOnSheet
        ) {
            if (this.have_Feat("Greater Crossblooded Evolution")) {
                return 3;
            } else {
                return 1;
            }
        } else {
            return 0;
        }
    }

    get_CrossbloodedEvolutionUnlocked(level: number = 0) {
        //This function is used to check how many crossblooded evolution spells have been assigned for this spell level or all levels.
        if (level == 0) {
            return this.spellCasting.spellChoices.filter(choice => choice.crossbloodedEvolution).length;
        } else {
            return this.spellCasting.spellChoices.filter(choice => choice.level == level && choice.crossbloodedEvolution).length;
        }
    }

    on_CrossbloodedEvolution() {
        this.characterService.set_Changed("spellchoices");
        this.characterService.set_ToChange("Character", "spellbook");
        this.characterService.process_ToChange();
    }

    on_ChangeSpellLevel(amount: number) {
        this.choice.level += amount;
    }

    on_SpellCombination() {
        this.choice.spells.length = 0;
        this.characterService.set_Changed("spellchoices");
        this.characterService.set_Changed("spellbook");
        this.characterService.process_ToChange();
    }

    get_HighestSpellLevel() {
        if (this.spellCasting) {
            //Get the available spell level of this casting. This is the higest spell level of the spell choices that are available at your character level.
            return Math.max(...this.spellCasting.spellChoices.filter(spellChoice => spellChoice.charLevelAvailable <= this.get_Character().level).map(spellChoice => spellChoice.dynamicLevel ? this.get_DynamicLevel(spellChoice) : spellChoice.level), 0);
        } else {
            return 1;
        }
    }

    get_DynamicLevel(choice: SpellChoice = this.choice) {
        return this.spellsService.get_DynamicSpellLevel(this.spellCasting, choice, this.characterService);
    }

    get_CHA() {
        return this.characterService.get_Abilities("Charisma")[0].mod(this.get_Character(), this.characterService, this.effectsService).result;
    }

    get_Available() {
        let choice = this.choice;
        let available: number = 0;
        if (choice.source == "Divine Font") {
            available = Math.max(choice.available + this.get_CHA(), 0);
        } else if (choice.source == "Spell Blending") {
            available = Math.max(choice.available + this.get_SpellBlendingUnlocked(choice.level), 0);
        } else if (this.is_InfinitePossibilitiesSpell()) {
            available = Math.max(choice.available + this.get_InfinitePossibilitiesUnlocked(choice.level), 0);
        } else if (this.is_AdaptedCantripSpell()) {
            available = Math.max(choice.available + this.get_AdaptedCantripUnlocked(), 0);
        } else if (this.is_AdaptiveAdeptSpell()) {
            available = Math.max(choice.available + this.get_AdaptiveAdeptUnlocked(), 0);
        } else if (
            ["Feat: Basic Wizard Spellcasting", "Feat: Expert Wizard Spellcasting", "Feat: Master Wizard Spellcasting"].includes(choice.source) &&
            choice.level <= this.get_HighestSpellLevel() - 2
        ) {
            available = Math.max(choice.available + this.have_Feat("Arcane Breadth") - this.get_SpellBlendingUsed() - this.get_InfinitePossibilitiesUsed(), 0);
        } else if (
            ["Feat: Basic Bard Spellcasting", "Feat: Expert Bard Spellcasting", "Feat: Master Bard Spellcasting"].includes(choice.source) &&
            choice.level <= this.get_HighestSpellLevel() - 2
        ) {
            available = Math.max(choice.available + this.have_Feat("Occult Breadth"), 0);
        } else if (
            ["Feat: Basic Druid Spellcasting", "Feat: Expert Druid Spellcasting", "Feat: Master Druid Spellcasting"].includes(choice.source) &&
            choice.level <= this.get_HighestSpellLevel() - 2
        ) {
            available = Math.max(choice.available + this.have_Feat("Primal Breadth"), 0);
        } else if (
            ["Feat: Basic Sorcerer Spellcasting", "Feat: Expert Sorcerer Spellcasting", "Feat: Master Sorcerer Spellcasting"].includes(choice.source) &&
            choice.level <= this.get_HighestSpellLevel() - 2
        ) {
            available = Math.max(choice.available + this.have_Feat("Bloodline Breadth"), 0);
        } else {
            available = Math.max(this.choice.available - this.get_SpellBlendingUsed() - this.get_InfinitePossibilitiesUsed() - this.get_AdaptedCantripUsed() - this.get_AdaptiveAdeptUsed(), 0);
        }
        //If this choice has more spells than it should have (unless they are locked), remove the excess.
        if (choice.spells.length > available) {
            choice.spells.filter(gain => !gain.locked).forEach((gain, index) => {
                if (index >= available) {
                    this.on_SpellTaken(gain.name, false, false);
                }
            })
        }
        return available;
    }

    get_AvailableSpells() {
        let choice = this.choice;
        //Get spell level from the choice level or from the dynamic choice level, if set.
        let spellLevel = choice.level;
        if (choice.dynamicLevel) {
            spellLevel = this.get_DynamicLevel();
        }
        let character = this.get_Character()

        let allSpells: Spell[];
        //Get spells from your spellbook for prepared wizard spells or if the choice requires it, otherwise get all spells.
        if ((this.spellCasting?.castingType == "Prepared" && this.spellCasting?.className == "Wizard" && !this.allowBorrow) || this.choice.spellBookOnly) {
            allSpells = this.spellsService.get_Spells().filter(spell =>
                character.class.spellBook.find((learned: SpellLearned) => learned.name == spell.name)
            );
        } else {
            allSpells = this.spellsService.get_Spells();
        }
        //Filter the list by the filter given in the choice.
        if (choice.filter.length) {
            allSpells = allSpells.filter(spell => choice.filter.map(filter => filter.toLowerCase()).includes(spell.name.toLowerCase()))
        }
        //Set up another Array to save the end result to, filtered from allSpells.
        let spells: Spell[] = [];
        //If this is a character spellcasting choice (and not a scroll or other item), filter the spells by the spellcasting's tradition.
        //  The choice's tradition is preferred over the spellcasting's tradition, if set. If neither is set, get all spells.
        if (this.spellCasting) {
            let traditionFilter = choice.tradition || this.spellCasting.tradition || "";
            //Keep either only Focus spells (and skip the tradition filter) or exclude Focus spells as needed.
            if (this.spellCasting.castingType == "Focus") {
                spells.push(...allSpells.filter(spell => spell.traits.includes(character.class.name) && spell.traditions.includes("Focus")));
            } else {
                if (choice.source == "Divine Font") {
                    //Divine Font only allows spells listed in your deity's divine font attribute.
                    let deity = character.class.deity ? this.characterService.get_Deities(character.class.deity)[0] : null;
                    spells.push(...allSpells.filter(spell =>
                        deity?.divineFont.includes(spell.name)
                    ));
                } else if (choice.source == "Feat: Esoteric Polymath") {
                    //With Impossible Polymath, you can choose spells of any tradition in the Esoteric Polymath choice so long as you are trained in the associated skill.
                    spells.push(...allSpells.filter(spell => spell.traditions.find(tradition => this.get_EsotericPolymathAllowed(this.spellCasting, tradition)) && !spell.traditions.includes("Focus")));
                } else if (choice.source == "Feat: Adapted Cantrip") {
                    //With Adapted Cantrip, you can choose spells of any tradition except your own.
                    spells.push(...allSpells.filter(spell => !spell.traditions.includes(this.spellCasting.tradition) && !spell.traditions.includes("Focus")));
                } else if (choice.source.includes("Feat: Adaptive Adept")) {
                    //With Adaptive Adept, you can choose spells of the same tradition(s) as with Adapted Cantrip, but not your own.
                    let adaptedcantrip = this.spellCasting.spellChoices.find(choice => choice.source == "Feat: Adapted Cantrip").spells[0];
                    if (adaptedcantrip) {
                        let originalSpell = this.spellsService.get_Spells(adaptedcantrip.name)[0];
                        if (originalSpell) {
                            spells.push(...allSpells.filter(spell => !spell.traditions.includes(this.spellCasting.tradition) && spell.traditions.some(tradition => originalSpell.traditions.includes(tradition)) && !spell.traditions.includes("Focus")));
                        }
                    }
                } else if (choice.crossbloodedEvolution && !(traditionFilter && choice.spells.some(takenSpell => !this.spellsService.get_Spells(takenSpell.name)[0]?.traditions.includes(traditionFilter)))) {
                    //With Crossblooded Evolution, you can choose spells of any tradition, unless you already have one of a different tradition than your own.
                    spells.push(...allSpells.filter(spell => !spell.traditions.includes("Focus")));
                } else if (traditionFilter) {
                    //If the tradition filter comes from the spellcasting, also include all spells that are on the spell list regardless of their tradition.
                    if (!choice.tradition && this.spellCasting.tradition) {
                        spells.push(...allSpells.filter(spell =>
                            (
                                spell.traditions.includes(traditionFilter) ||
                                this.get_Character().get_SpellListSpell(spell.name).length
                            ) &&
                            !spell.traditions.includes("Focus")
                        ));
                    } else {
                        spells.push(...allSpells.filter(spell =>
                            spell.traditions.includes(traditionFilter) &&
                            !spell.traditions.includes("Focus")
                        ));
                    }
                } else {
                    spells.push(...allSpells.filter(spell => !spell.traditions.includes("Focus")));
                }
            }
        } else {
            //If this is an item spell choice, only the choice's tradition is relevant. If it's not set, keep all spells except Focus spells.
            let traditionFilter = choice.tradition || "";
            if (traditionFilter) {
                spells.push(...allSpells.filter(spell => spell.traditions.includes(traditionFilter) && !spell.traditions.includes("Focus")));
            } else {
                spells.push(...allSpells.filter(spell => !spell.traditions.includes("Focus")));
            }
        }
        //If a certain target is required, filter out the spells that don't match it.
        switch (choice.target) {
            case "Others":
                spells = spells.filter(spell => spell.target != "self");
                break;
            case "Allies":
                spells = spells.filter(spell => spell.target == "ally");
                break;
            case "Caster":
                spells = spells.filter(spell => spell.target == "self");
                break;
            case "Enemies":
                spells = spells.filter(spell => spell.target == "")
        }
        //If a trait filter is set, keep only spells that match it, with extra handling for "Common".
        if (choice.traitFilter.length) {
            //There is no actual Common trait. If a spell choice is limited to common spells,
            //  exclude all uncommon and rare spells, then process the rest of the trait filter.
            if (choice.traitFilter.includes("Common")) {
                let traitFilter = choice.traitFilter.filter(trait => trait != "Common");
                spells = spells.filter(spell =>
                    !spell.traits.includes("Uncommon") &&
                    !spell.traits.includes("Rare") &&
                    (
                        traitFilter.length ?
                            spell.traits.find(trait => traitFilter.includes(trait))
                            : true
                    )
                );
            } else {
                spells = spells.filter(spell => spell.traits.find(trait => choice.traitFilter.includes(trait)));
            }
        }
        //If only spells are allowed that target a single creature or object, these are filtered here.
        if (choice.singleTarget) {
            spells = spells.filter(spell => spell.singleTarget);
        }
        //If any spells in the choice have become invalid (i.e. they aren't on the list), remove them, unless they are locked. You need to reload the spells area if this happens.
        let spellNumber = choice.spells.length;
        choice.spells = this.choice.spells.filter(spell => spell.locked || spells.some(availableSpell => availableSpell.name == spell.name))
        if (choice.spells.length < spellNumber) {
            this.characterService.set_ToChange("Character", "spellbook");
            this.characterService.process_ToChange();
        }
        //If any locked spells remain that aren't in the list, add them to the list.
        spells.push(...allSpells.filter(spell => choice.spells.some(existingSpell => existingSpell.locked && existingSpell.name == spell.name) && !spells.some(addedSpell => addedSpell.name == spell.name)));
        //If any spells are left after this, we apply secondary, mechanical filters.
        if (spells.length) {
            //Get only Cantrips if the spell level is 0, but keep those already taken.
            if (spellLevel == 0) {
                spells = spells.filter(spell => spell.traits.includes("Cantrip") || this.get_SpellTakenByThis(spell.name));
            } else {
                spells = spells.filter(spell => !spell.traits.includes("Cantrip") || this.get_SpellTakenByThis(spell.name));
            }
            //Spell combination spell choices have special requirements, but they are also transformed from existing spell choices, so we don't want to change their properties.
            //The requirements that would usually be handled as choice properties are handled on the fly here.
            //The requirements are as follows:
            // - Spell Level is up to 2 lower than the spell slot
            // - The spell must be able to target a single creature other than the caster. This is ensured by the "singletarget" property in the spell.
            // - The second spell must have the same method of determining its success as the first - Attack trait, the same saving throw or neither.
            if (choice.spellCombination) {
                spells = spells.filter(spell =>
                    (spell.levelreq <= spellLevel - 2) &&
                    (!this.showHeightened ? spell.levelreq == spellLevel - 2 : true) &&
                    spell.singleTarget
                )
                if (choice.spells.length) {
                    if (choice.spells[0].name && choice.spells[0].combinationSpellName) {
                        let availableSpells: Spell[] = spells.filter(spell =>
                            this.get_SpellTakenByThis(spell.name)
                        );
                        return availableSpells.sort(function (a, b) {
                            if (choice.spells[0].name == a.name) {
                                return -1;
                            }
                            if (choice.spells[0].name == b.name) {
                                return 1;
                            }
                            return 0
                        });
                    }
                    let existingSpell = this.get_Spells(choice.spells[0].name)[0];
                    spells = spells.filter(spell =>
                        (existingSpell.traits.includes("Attack") == spell.traits.includes("Attack")) &&
                        (existingSpell.savingThrow.includes("Fortitude") == spell.savingThrow.includes("Fortitude")) &&
                        (existingSpell.savingThrow.includes("Reflex") == spell.savingThrow.includes("Reflex")) &&
                        (existingSpell.savingThrow.includes("Will") == spell.savingThrow.includes("Will"))
                    )
                }
                let availableSpells: Spell[] = spells.filter(spell =>
                    this.cannotTake(spell).length == 0 || this.get_SpellTakenByThis(spell.name)
                )
                return availableSpells
                    .sort(function (a, b) {
                        if (a.name > b.name) {
                            return 1;
                        }
                        if (a.name < b.name) {
                            return -1;
                        }
                        return 0
                    });
            }
            //Don't show spells of a different level unless heightened spells are allowed. Never show spells of a different level if this is a level 0 choice.
            if (!this.showHeightened && (spellLevel > 0)) {
                spells = spells.filter(spell => spell.levelreq == spellLevel || this.get_SpellTakenByThis(spell.name));
            } else if (spellLevel > 0) {
                //Still don't show higher level non-cantrip spells even if heightened spells are allowed.
                spells = spells.filter(spell => spell.levelreq <= spellLevel || this.get_SpellTakenByThis(spell.name));
            }
            //Finally, if there are fewer spells selected than available, show all spells that individually match the requirements or that are already selected.
            // If the available spells are exhausted, only show the selected ones unless showOtherOptions is true.
            if (choice.spells.length < this.get_Available()) {
                return spells
                    .sort(function (a, b) {
                        if (a.name > b.name) {
                            return 1;
                        }
                        if (a.name < b.name) {
                            return -1;
                        }
                        return 0
                    });
            } else {
                let showOtherOptions = this.get_Character().settings.showOtherOptions;
                let availableSpells: Spell[] = spells.filter(spell =>
                    this.get_SpellTakenByThis(spell.name) || showOtherOptions
                )
                return availableSpells
                    .sort(function (a, b) {
                        if (a.name > b.name) {
                            return 1;
                        }
                        if (a.name < b.name) {
                            return -1;
                        }
                        return 0
                    });
            }
        }
    }

    cleanup_ChoiceSpells(spellList: Spell[], choice: SpellChoice) {
        choice.spells.forEach(gain => {
            if (!spellList?.map(spell => spell.name)?.includes(gain.name)) {
                if (!gain.locked) {
                    this.get_Character().take_Spell(this.characterService, gain.name, false, choice, gain.locked);
                }
            }
        })
    }

    cannotTakeSome() {
        let anytrue = 0;
        this.choice.spells.forEach(gain => {
            if (this.cannotTake(this.get_Spells(gain.name)[0]).length) {
                if (!gain.locked) {
                    this.get_Character().take_Spell(this.characterService, gain.name, false, this.choice, gain.locked);
                } else {
                    anytrue += 1;
                }
            }
        });
        this.characterService.process_ToChange();
        return anytrue;
    }

    cannotTake(spell: Spell) {
        let choice = this.choice;
        let takenByThis = this.get_SpellTakenByThis(spell.name);
        if (takenByThis && choice.spells.find(spellGain => spellGain.name == spell.name && spellGain.locked)) {
            return [];
        }
        let spellLevel = choice.level;
        if (choice.dynamicLevel) {
            spellLevel = this.get_DynamicLevel(choice);
        }
        let reasons: {reason: string, explain: string}[] = [];
        //Are the basic requirements (so far just level) not met?
        if (!spell.canChoose(this.characterService, spellLevel)) {
            reasons.push({reason: "Requirements unmet", "explain": "The requirements are not met."});
        }
        //Has it already been taken at this level by this class, and was that not by this SpellChoice? (Only for spontaneous spellcasters.)
        if (this.get_SpellTakenThisLevel(spell, spellLevel) && !takenByThis) {
            reasons.push({reason: "Already taken", explain: "You already have this spell on this level with this class."});
        }
        return reasons;
    }

    get_SpellTakenByThis(spellName: string, choice: SpellChoice = this.choice) {
        //Returns the amount of times that this spell has been taken in this choice, exluding locked spells. Needs to be a number for prepared spells.
        return choice.spells.filter(takenSpell => !takenSpell.locked && takenSpell.name == spellName || takenSpell.combinationSpellName == spellName).length;
    }

    get_SpellTakenThisLevel(spell: Spell, spellLevel: number = 0) {
        //Returns whether this spell has been taken in this spellcasting at this level at all (only for spontaneous spellcasters.)
        //Returns false for spontaneous spell choices that draw from your spellbook (i.e. Esoteric Polymath and Arcane Evolution) and for spell choices with a cooldown.
        let choice = this.choice;
        if (!spellLevel) {
            spellLevel = choice.level;
            if (choice.dynamicLevel) {
                spellLevel = this.get_DynamicLevel(choice);
            }
        }
        return (
            !choice.spellBookOnly &&
            !choice.cooldown &&
            this.spellCasting?.castingType == "Spontaneous" &&
            !this.itemSpell &&
            spell.have(this.characterService, this.spellCasting, spellLevel, choice.className, false)
        );
    }

    get_TakenSpell(spellName: string) {
        //Returns the first SpellGain of this spell in this choice.
        return this.choice.spells.find(takenSpell => takenSpell.name == spellName || takenSpell.combinationSpellName == spellName);
    }

    get_LockedSpellTakenByThis(spellName: string) {
        //Returns the amount of times that this spell is included in this choice as a locked spell. Needs to be a number for prepared spells.
        return this.choice.spells.filter(takenSpell => takenSpell.locked && takenSpell.name == spellName).length;
    }

    on_SpellTaken(spellName: string, taken: boolean, locked: boolean) {
        let choice = this.choice;
        //Close the menu if all slots are filled, unless it's a spell combination choice.
        if (taken && this.get_Character().settings.autoCloseChoices && !choice.spellCombination && (choice.spells.length == this.get_Available() - 1)) { this.toggle_Choice("") }
        let prepared: boolean = this.prepared;
        let character = this.get_Character();
        character.take_Spell(this.characterService, spellName, taken, choice, locked, prepared);
        //For the Esoteric Polymath feat and the Arcane Evolution feat, if you choose a spell that is in your repertoire (i.e. if other spell choices have this spell in it),
        // the choice is turned into a signature spell choice. If you drop the spell, turn signature spell off.
        if (["Feat: Esoteric Polymath", "Feat: Arcane Evolution"].includes(choice.source)) {
            if (taken) {
                if (this.spellCasting.spellChoices.find(otherChoice => otherChoice !== choice && this.get_SpellTakenByThis(spellName, otherChoice))) {
                    choice.spells.forEach(gain => gain.signatureSpell = true);
                }
            } else {
                choice.spells.forEach(gain => gain.signatureSpell = false);
            }
        }
        //The Interweave Dispel feat is dependent on having Dispel in your repertoire, so we update that here.
        if (spellName == "Dispel Magic" && !taken) {
            if (this.have_Feat("Interweave Dispel")) {
                this.characterService.set_ToChange("Character", "featchoices");
            }
        }
        this.characterService.set_ToChange("Character", "spells");
        this.characterService.set_ToChange("Character", "spellchoices");
        this.characterService.set_ToChange("Character", "spellbook");
        this.characterService.process_ToChange();
    }

    on_SpellCombinationTaken(spellName: string, taken: boolean) {
        if (taken && this.get_Character().settings.autoCloseChoices) {
            this.toggle_Choice("")
            this.choice.spells[0].combinationSpellName = spellName;
        } else {
            this.choice.spells[0].combinationSpellName = "";
        }
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (["spellchoices", "all", "Character"].includes(target)) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature == "Character" && ["spellchoices", "all"].includes(view.target)) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        if (!this.level) {
            this.level = this.choice.level;
        }
        this.finish_Loading();
    }

}
