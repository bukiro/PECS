import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SpellChoice } from 'src/app/SpellChoice';
import { SpellsService } from 'src/app/spells.service';
import { CharacterService } from 'src/app/character.service';
import { Spell } from 'src/app/Spell';
import { TraitsService } from 'src/app/traits.service';
import { SortByPipe } from 'src/app/sortBy.pipe';

@Component({
    selector: 'app-spellchoice',
    templateUrl: './spellchoice.component.html',
    styleUrls: ['./spellchoice.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellchoiceComponent implements OnInit {

    @Input()
    choice: SpellChoice
    @Input()
    allowHeightened: boolean = false;
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

    get_MaxSpellLevel() {
        return Math.ceil(this.get_Character().level / 2);
    }

    get_Tradition(choice: SpellChoice) {
        let character = this.get_Character()
        switch (choice.tradition) {
            case "Sorcerer":
                return character.class.bloodline.spellList;
            default:
                return choice.tradition;
        }
    }

    get_AvailableSpells(choice: SpellChoice) {
        let character = this.get_Character()
        let allSpells = this.spellsService.get_Spells();
        if (choice.filter.length) {
            allSpells = allSpells.filter(spell => choice.filter.includes(spell.name))
        }
        let spells: Spell[] = [];
        switch (choice.tradition) {
            case "":
                spells.push(...allSpells.filter(spell => !spell.traditions.includes("Focus")));
                break;
            case "Focus":
                spells.push(...allSpells.filter(spell => spell.traits.includes(character.class.name) && spell.traditions.includes("Focus")));
                break;
            case "Sorcerer":
                let tradition = character.class.bloodline.spellList;
                //Get all spells of the tradition or of the bloodline granted spells
                spells.push(...allSpells.filter(spell => spell.traditions.includes(tradition) || character.class.bloodline.grantedSpells.map(gain => gain.name).includes(spell.name)));
                break;
            default:
                spells.push(...allSpells.filter(spell => spell.traditions.includes(tradition)));
                break;
        }
        switch (choice.target) {
            case "Others":
                spells = spells.filter(spell => !spell.target || spell.target == "ally" || spell.target == "companion");
                break;
            case "Caster":
                spells = spells.filter(spell => spell.target == "self");
                break;
        }
        if (spells.length) {
            if (choice.level == 0) {
                spells = spells.filter(spell => spell.traits.includes("Cantrip") || this.spellTakenByThis(spell, choice));
            } else {
                spells = spells.filter(spell => !spell.traits.includes("Cantrip") || this.spellTakenByThis(spell, choice));
            }
            if (!this.allowHeightened && choice.level > 0) {
                spells = spells.filter(spell => spell.levelreq == choice.level || this.spellTakenByThis(spell, choice));
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

    cannotTake(spell: Spell, choice: SpellChoice) {
        let spellLevel = choice.level;
        let reasons: string[] = [];
        //Are the basic requirements (so far just level) not met?
        if (!spell.canChoose(this.characterService, spellLevel)) {
            reasons.push("The requirements are not met.")
        }
        //Has it already been taken at this level by this class, and was that not by this SpellChoice?
        if (!this.itemSpell && spell.have(this.characterService, spellLevel, choice.className) && !this.spellTakenByThis(spell, choice)) {
            reasons.push("You already have this spell with this class.");
        }
        return reasons;
    }

    spellTakenByThis(spell: Spell, choice: SpellChoice) {
        return choice.spells.filter(takenSpell => takenSpell.name == spell.name).length > 0;
    }

    get_SpellsTaken(minLevelNumber: number, maxLevelNumber: number, spellLevel: number, spellName: string, source: string = "", sourceId: string = "", locked: boolean = undefined) {
        return this.get_Character().get_SpellsTaken(this.characterService, minLevelNumber, maxLevelNumber, spellLevel, spellName, "", "", source, sourceId, locked);
    }

    on_SpellTaken(spellName: string, taken: boolean, choice: SpellChoice, locked: boolean) {
        if (taken && (choice.spells.length == choice.available - 1)) { this.showChoice=""; }
        this.get_Character().take_Spell(this.characterService, spellName, taken, choice, locked);
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe(() => 
            this.changeDetector.detectChanges()
                )
            return true;
        }
    }

    ngOnInit() {
        if (!this.level) {
            this.level = this.choice.level;
        }
        //this.finish_Loading();
    }

}
