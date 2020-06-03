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
import { ThrowStmt } from '@angular/compiler';
import { SpellLearned } from 'src/app/SpellLearned';

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
        if (this.characterService.get_FeatsAndFeatures()
            .filter(feature => feature.allowSignatureSpells)
            .filter(feature => feature.have(this.get_Character(), this.characterService)).length) {
            return true;
        } else {
            return false;
        }
    }

    is_SignatureSpell(choice: SpellChoice) {
        return this.get_SignatureSpellsAllowed() && choice.signatureSpell;
    }

    get_DynamicLevel(choice: SpellChoice) {
        let highestSpellLevel = 1;
        if (this.spellCasting) {
            highestSpellLevel = Math.max(...this.spellCasting.spellChoices.map(choice => choice.level))
        }
        try {
            return parseInt(eval(choice.dynamicLevel));
        } catch (e) {
            console.log("Error parsing spell level requirement ("+choice.dynamicLevel+"): "+e)
            return 1;
        }
    }

    get_CHA() {
        return this.characterService.get_Abilities("Charisma")[0].mod(this.get_Character(), this.characterService, this.effectsService).result;
    }

    get_Available(choice: SpellChoice) {
        if (choice.source == "Divine Font") {
            return Math.max(choice.available + this.get_CHA(), 0)
        } else {
            return choice.available;
        }
    }

    get_AvailableSpells(choice: SpellChoice) {
        let spellLevel = choice.level;
        if (choice.dynamicLevel) {
            spellLevel = this.get_DynamicLevel(choice);
        }
        let character = this.get_Character()
        
        let allSpells = this.spellsService.get_Spells();
        if (this.spellCasting.castingType == "Prepared" && this.spellCasting.className == "Wizard" && !this.allowBorrow) {
            allSpells = this.spellsService.get_Spells().filter(spell =>
                this.spellTakenByThis(spell, choice) ||
                this.get_Character().class.spellBook.find((learned: SpellLearned) => learned.name == spell.name)
            );
        } else {
            allSpells = this.spellsService.get_Spells();
        }
        if (choice.filter.length) {
            allSpells = allSpells.filter(spell => choice.filter.includes(spell.name))
        }
        let spells: Spell[] = [];
        if (this.spellCasting) {
            let traditionFilter = choice.tradition || this.spellCasting.tradition || "";
            if (this.spellCasting.castingType == "Focus") {
                spells.push(...allSpells.filter(spell => spell.traits.includes(character.class.name) && spell.traditions.includes("Focus")));
            } else {
                if (traditionFilter) {
                    spells.push(...allSpells.filter(spell => spell.traditions.includes(traditionFilter) && !spell.traditions.includes("Focus")));
                } else {
                    spells.push(...allSpells.filter(spell => !spell.traditions.includes("Focus")));
                }
            }
        } else {
            let traditionFilter = choice.tradition || "";
            if (traditionFilter) {
                spells.push(...allSpells.filter(spell => spell.traditions.includes(traditionFilter) && !spell.traditions.includes("Focus")));
            } else {
                spells.push(...allSpells.filter(spell => !spell.traditions.includes("Focus")));
            }
        }
        switch (choice.target) {
            case "Others":
                spells = spells.filter(spell => !spell.target || spell.target == "ally" || spell.target == "companion");
                break;
            case "Caster":
                spells = spells.filter(spell => spell.target == "self");
                break;
        }
        if (choice.traitFilter.length) {
            spells = spells.filter(spell => spell.traits.find(trait => choice.traitFilter.includes(trait)));
        }
        if (spells.length) {
            if (spellLevel == 0) {
                spells = spells.filter(spell => spell.traits.includes("Cantrip") || this.spellTakenByThis(spell, choice));
            } else {
                spells = spells.filter(spell => !spell.traits.includes("Cantrip") || this.spellTakenByThis(spell, choice));
            }
            if (!this.allowHeightened && (spellLevel > 0)) {
                spells = spells.filter(spell => spell.levelreq == spellLevel || this.spellTakenByThis(spell, choice));
            }
            if (choice.spells.length < choice.available) {
                let availableSpells: Spell[] = spells.filter(spell => 
                    this.cannotTake(spell, choice).length == 0 || this.spellTakenByThis(spell, choice)
                )
                return this.sortByPipe.transform(availableSpells, "asc", "name")
            } else {
                let availableSpells: Spell[] = spells.filter(spell => 
                    this.spellTakenByThis(spell, choice)
                )
                return this.sortByPipe.transform(availableSpells, "asc", "name")
            }
        }
    }

    cannotTakeSome(choice: SpellChoice) {
        let anytrue = 0;
        choice.spells.forEach(gain => {
            if (this.cannotTake(this.get_Spells(gain.name)[0], choice).length) {
                if (!gain.locked) {
                    this.get_Character().take_Spell(this.characterService, gain.name, false, choice, gain.locked);
                    this.characterService.set_Changed();
                } else {
                    anytrue += 1;
                }
            }
        });
        return anytrue;
    }

    cannotTake(spell: Spell, choice: SpellChoice, gain: SpellGain = null) {
        if (this.spellTakenByThis(spell, choice) && choice.spells.find(gain => gain.name == spell.name && gain.locked)) {
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
        if (this.spellCasting.castingType == "Spontaneous" && !this.itemSpell && spell.have(this.characterService, this.spellCasting, spellLevel, choice.className) && !this.spellTakenByThis(spell, choice)) {
            reasons.push("You already have this spell with this class.");
        }
        return reasons;
    }

    spellTakenByThis(spell: Spell, choice: SpellChoice) {
        return choice.spells.filter(takenSpell => takenSpell.name == spell.name).length;
    }

    on_SpellTaken(spellName: string, taken: boolean, choice: SpellChoice, locked: boolean) {
        if (taken && (choice.spells.length == choice.available - 1)) { this.showChoice=""; }
        this.get_Character().take_Spell(this.characterService, spellName, taken, choice, locked);
        this.characterService.set_Changed("Character");
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
                if (["spellchoice", "all", "Character"].includes(target)) {
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
