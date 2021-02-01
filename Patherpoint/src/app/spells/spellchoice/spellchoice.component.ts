import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SpellChoice } from 'src/app/SpellChoice';
import { SpellsService } from 'src/app/spells.service';
import { CharacterService } from 'src/app/character.service';
import { Spell } from 'src/app/Spell';
import { TraitsService } from 'src/app/traits.service';
import { SortByPipe } from 'src/app/sortBy.pipe';
import { SpellCasting } from 'src/app/SpellCasting';
import { EffectsService } from 'src/app/effects.service';
import { SpellGain } from 'src/app/SpellGain';
import { SpellLearned } from 'src/app/SpellLearned';
import { VirtualTimeScheduler } from 'rxjs';

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
    allowHeightened: boolean = false;
    @Input()
    allowBorrow: boolean = false;
    @Input()
    showChoice: string = "";
    @Input()
    showSpell: string = "";
    @Output()
    showChoiceMessage = new EventEmitter<string>();
    @Output()
    showSpellMessage = new EventEmitter<string>();
    @Input()
    level: number;
    @Input()
    itemSpell: boolean = false;
    @Input()
    prepared: boolean = false;
    //Are we choosing character spells from the spellbook/repertoire? If not, some functions will be disabled.
    @Input()
    spellbook: boolean = false;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private spellsService: SpellsService,
        private traitsService: TraitsService,
        private effectsService: EffectsService,
        private sortByPipe: SortByPipe
    ) { }

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
        this.showChoiceMessage.emit(this.showChoice)
    }

    get_ShowSpell() {
        return this.showSpell;
    }

    get_ShowChoice() {
        return this.showChoice;
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    trackByIndex(index: number, obj: any): any {
        return index;
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

    get_SignatureSpellsAllowed() {
        if (
            this.get_Available(this.choice) == 1 &&
            this.choice.level > 0 &&
            this.spellCasting?.className == this.get_Character().class.name &&
            this.characterService.get_FeatsAndFeatures()
                .find(feature => feature.allowSignatureSpells && feature.have(this.get_Character(), this.characterService)) &&
            this.choice.source != "Feat: Esoteric Polymath"
        ) {
            return true;
        } else {
            return false;
        }
    }

    is_SignatureSpell(choice: SpellChoice, signatureSpellsAllowed: boolean) {
        return (signatureSpellsAllowed || choice.source == "Feat: Esoteric Polymath") && choice.signatureSpell;
    }

    get_SignatureSpellsUnlocked(level: number) {
        //This function is used to check if a signature spell has been assigned for this spell level.
        if (level == 0) {
            return 0;
        } else {
            return this.spellCasting.spellChoices.filter(choice => choice.level == level && choice.signatureSpell).length;
        }
    }

    on_SignatureSpell() {
        this.characterService.set_Changed("spellchoices");
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
        if (this.get_InfinitePossibilitiesAllowed() || this.is_InfinitePossibilitiesSpell(this.choice)) {
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

    is_InfinitePossibilitiesSpell(choice: SpellChoice) {
        return choice.source == "Feat: Infinite Possibilities";
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
        if (this.get_AdaptedCantripAllowed() || this.is_AdaptedCantripSpell(this.choice)) {
            //Check if any spell slots have been traded in for AC.
            return this.spellCasting.spellChoices.find(choice => choice.adaptedCantrip) ? 1 : 0;
        } else {
            return 0;
        }
    }

    is_AdaptedCantripSpell(choice: SpellChoice) {
        return choice.source == "Feat: Adapted Cantrip";
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
        if (this.get_AdaptiveAdeptAllowed() || this.is_AdaptiveAdeptSpell(this.choice)) {
            //Check if any spell slots have been traded in for AC.
            return this.spellCasting.spellChoices.find(choice => choice.adaptiveAdept) ? 1 : 0;
        } else {
            return 0;
        }
    }

    is_AdaptiveAdeptSpell(choice: SpellChoice) {
        return choice.source.includes("Feat: Adaptive Adept");
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

    on_ChangeSpellLevel(choice: SpellChoice, amount: number) {
        choice.level += amount;
    }

    on_SpellCombination(choice: SpellChoice) {
        choice.spells.length = 0;
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

    get_DynamicLevel(choice: SpellChoice) {
        return this.spellsService.get_DynamicSpellLevel(this.spellCasting, choice, this.characterService);
    }

    get_CHA() {
        return this.characterService.get_Abilities("Charisma")[0].mod(this.get_Character(), this.characterService, this.effectsService).result;
    }

    get_Available(choice: SpellChoice) {
        let available: number = 0;
        if (choice.source == "Divine Font") {
            available = Math.max(choice.available + this.get_CHA(), 0);
        } else if (choice.source == "Spell Blending") {
            available = Math.max(choice.available + this.get_SpellBlendingUnlocked(choice.level), 0);
        } else if (this.is_InfinitePossibilitiesSpell(choice)) {
            available = Math.max(choice.available + this.get_InfinitePossibilitiesUnlocked(choice.level), 0);
        } else if (this.is_AdaptedCantripSpell(choice)) {
            available = Math.max(choice.available + this.get_AdaptedCantripUnlocked(), 0);
        } else if (this.is_AdaptiveAdeptSpell(choice)) {
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
        } else {
            available = Math.max(this.choice.available - this.get_SpellBlendingUsed() - this.get_InfinitePossibilitiesUsed() - this.get_AdaptedCantripUsed() - this.get_AdaptiveAdeptUsed(), 0);
        }
        //If this choice has more spells than it should have (unless they are locked), remove the excess.
        if (choice.spells.length > available) {
            choice.spells.filter(gain => !gain.locked).forEach((gain, index) => {
                if (index >= available) {
                    this.on_SpellTaken(gain.name, false, choice, false);
                }
            })
        }
        return available;
    }

    get_AvailableSpells(choice: SpellChoice) {
        //Get spell level from the choice level or from the dynamic choice level, if set.
        let spellLevel = choice.level;
        if (choice.dynamicLevel) {
            spellLevel = this.get_DynamicLevel(choice);
        }
        let character = this.get_Character()

        let allSpells: Spell[];
        //Get spells from your spellbook for prepared wizard spells or if the choice requires it, otherwise get all spells.
        if ((this.spellCasting?.castingType == "Prepared" && this.spellCasting?.className == "Wizard" && !this.allowBorrow) || this.choice.spellBookOnly) {
            allSpells = this.spellsService.get_Spells().filter(spell =>
                this.spellTakenByThis(spell.name, choice) ||
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
                        deity?.divineFont.includes(spell.name) &&
                        (
                            choice.spells.length ? this.spellTakenByThis(spell.name, choice) : true
                        )
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
        //If any spells are left after this, we apply secondary, mechanical filters.
        //We usually keep spells that are already in the choice, even if they don't match the requirements. This allows to deselect them in the UI.
        if (spells.length) {
            //Get only Cantrips if the spell level is 0, but keep those already taken.
            if (spellLevel == 0) {
                spells = spells.filter(spell => spell.traits.includes("Cantrip") || this.spellTakenByThis(spell.name, choice));
            } else {
                spells = spells.filter(spell => !spell.traits.includes("Cantrip") || this.spellTakenByThis(spell.name, choice));
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
                    (!this.allowHeightened ? spell.levelreq == spellLevel - 2 : true) &&
                    spell.singleTarget
                )
                if (choice.spells.length) {
                    if (choice.spells[0].name && choice.spells[0].combinationSpellName) {
                        let availableSpells: Spell[] = spells.filter(spell =>
                            this.spellTakenByThis(spell.name, choice)
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
                    this.cannotTake(spell, choice).length == 0 || this.spellTakenByThis(spell.name, choice)
                )
                return this.sortByPipe.transform(availableSpells, "asc", "name")
            }
            //Don't show spells of a different level unless heightened spells are allowed. Never show spells of a different level if this is a level 0 choice.
            if (!this.allowHeightened && (spellLevel > 0)) {
                spells = spells.filter(spell => spell.levelreq == spellLevel || this.spellTakenByThis(spell.name, choice));
            }
            //Finally, if there are fewer spells selected than available, show all spells that individually match the requirements or that are already selected.
            // If the available spells are exhausted, only show the selected ones.
            if (choice.spells.length < this.get_Available(choice)) {
                let availableSpells: Spell[] = spells.filter(spell =>
                    this.cannotTake(spell, choice).length == 0 || this.spellTakenByThis(spell.name, choice)
                )
                return this.sortByPipe.transform(availableSpells, "asc", "name")
            } else {
                let availableSpells: Spell[] = spells.filter(spell =>
                    this.spellTakenByThis(spell.name, choice)
                )
                return this.sortByPipe.transform(availableSpells, "asc", "name")
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

    cannotTakeSome(choice: SpellChoice) {
        let anytrue = 0;
        choice.spells.forEach(gain => {
            if (this.cannotTake(this.get_Spells(gain.name)[0], choice).length) {
                if (!gain.locked) {
                    this.get_Character().take_Spell(this.characterService, gain.name, false, choice, gain.locked);
                } else {
                    anytrue += 1;
                }
            }
        });
        this.characterService.process_ToChange();
        return anytrue;
    }

    cannotTake(spell: Spell, choice: SpellChoice, gain: SpellGain = null) {
        if (this.spellTakenByThis(spell.name, choice) && choice.spells.find(spellGain => spellGain.name == spell.name && spellGain.locked)) {
            return "";
        }
        let spellLevel = choice.level;
        if (choice.dynamicLevel) {
            spellLevel = this.get_DynamicLevel(choice);
        }
        let reasons: string[] = [];
        //Are the basic requirements (so far just level) not met?
        if (!spell.canChoose(this.characterService, spellLevel)) {
            reasons.push("The requirements are not met.")
        }
        //Has it already been taken at this level by this class, and was that not by this SpellChoice? (Only for spontaneous spellcasters.)
        //Skip this check for spontaneous spell choices that draw from your spellbook (i.e. Esoteric Polymath)
        if (!choice.spellBookOnly && this.spellCasting?.castingType == "Spontaneous" && !this.itemSpell && spell.have(this.characterService, this.spellCasting, spellLevel, choice.className) && !this.spellTakenByThis(spell.name, choice)) {
            reasons.push("You already have this spell with this class.");
        }
        return reasons;
    }

    spellTakenByThis(spellName: string, choice: SpellChoice) {
        //Returns the amount of times that this spell has been taken in this choice, exluding locked spells. Needs to be a number for prepared spells.
        return choice.spells.filter(takenSpell => !takenSpell.locked && takenSpell.name == spellName || takenSpell.combinationSpellName == spellName).length;
    }

    lockedSpellTakenByThis(spellName: string, choice: SpellChoice) {
        //Returns the amount of times that this spell is included in this choice as a locked spell. Needs to be a number for prepared spells.
        return choice.spells.filter(takenSpell => takenSpell.locked && takenSpell.name == spellName).length;
    }

    on_SpellTaken(spellName: string, taken: boolean, choice: SpellChoice, locked: boolean) {
        //Close the menu if all slots are filled, unless it's a spell combination choice.
        if (taken && this.get_Character().settings.autoCloseChoices && !choice.spellCombination && (choice.spells.length == this.get_Available(choice) - 1)) { this.toggle_Choice("") }
        let prepared: boolean = this.prepared;
        let character = this.get_Character();
        character.take_Spell(this.characterService, spellName, taken, choice, locked, prepared);
        //For the Esoteric Polymath feat, if you choose a spell that is in your repertoire (i.e. if other spell choices have this spell in it),
        //The choice is turned into a signature spell choice. If you drop the spell, turn signature spell off.
        if (choice.source == "Feat: Esoteric Polymath") {
            if (taken) {
                if (this.spellCasting.spellChoices.find(otherChoice => otherChoice !== choice && this.spellTakenByThis(spellName, otherChoice))) {
                    choice.signatureSpell = true;
                }
            } else {
                choice.signatureSpell = false;
            }
        }
        this.characterService.set_ToChange("Character", "spells");
        this.characterService.set_ToChange("Character", "spellchoices");
        this.characterService.set_ToChange("Character", "spellbook");
        this.characterService.process_ToChange();
    }

    on_SpellCombinationTaken(spellName: string, taken: boolean, choice: SpellChoice) {
        if (taken && this.get_Character().settings.autoCloseChoices) {
            this.toggle_Choice("")
            choice.spells[0].combinationSpellName = spellName;
        } else {
            choice.spells[0].combinationSpellName = "";
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
