import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CharacterService } from '../character.service';
import { Spell } from '../Spell';
import { TraitsService } from '../traits.service';
import { SpellsService } from '../spells.service';
import { SpellGain } from '../SpellGain';
import { ItemsService } from '../items.service';
import { TimeService } from '../time.service';

@Component({
    selector: 'app-spellbook',
    templateUrl: './spellbook.component.html',
    styleUrls: ['./spellbook.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellbookComponent implements OnInit {

    private showSpell: number = 0;
    private id: number = 0;
    public hover: number = 0;
    public Math = Math;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private traitsService: TraitsService,
        private spellsService: SpellsService,
        private itemsService: ItemsService,
        private timeService: TimeService
    ) { }
    
    minimize() {
        this.characterService.get_Character().settings.spellbookMinimized = !this.characterService.get_Character().settings.spellbookMinimized;
    }

    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span("spellbook");
        })
    }

    toggle_Spell(id: number) {
        if (this.showSpell == id) {
            this.showSpell = 0;
        } else {
            this.showSpell = id;
        }
    }

    get_showSpell() {
        return this.showSpell;
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    get_ID() {
        this.id++;
        return this.id;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    toggleSpellsMenu() {
        this.characterService.toggleMenu('spells');
    }

    get_SpellClasses() {
        let classes: string[] = [];
        let levels = this.get_Character().class.levels.filter(level => level.number <= this.get_Character().level );
        levels.forEach(level => {
            level.spellChoices.forEach(choice => {
                if (!classes.includes(choice.className)) {
                    classes.push(choice.className);
                }
            })
        })
        return classes;
    }

    get_SpellsByLevel(levelNumber: number, className: string) {
        this.id = levelNumber * 1000;
        let character = this.characterService.get_Character();
        if (levelNumber == -1) {
            return character.get_SpellsTaken(this.characterService, 1, character.level, levelNumber, "", className, "Focus");
        } else {
            return character.get_SpellsTaken(this.characterService, 1, character.level, levelNumber, "", className, "", "", "", undefined, true);
        }
    }

    get_Spells(name: string) {
        return this.spellsService.get_Spells(name);
    }

    get_FocusPoints() {
        return Math.min(this.characterService.get_Character().class.focusPoints, this.get_MaxFocusPoints());
    }

    get_MaxFocusPoints() {
        return this.characterService.get_MaxFocusPoints();
    }

    get_UsedSpellSlots(spellLevel: number, className: string) {
        if (className == "Sorcerer") {
            return this.get_Character().class.bloodline.spellSlotsUsed[spellLevel];
        } else {
            return 0;
        }
    }

    get_MaxSpellSlots(spellLevel: number, className: string) {
        if (["Bard", "Sorcerer"].includes(className) && spellLevel > 0) {
            let spellslots: number = 0;
            let levels = this.get_Character().class.levels.filter(level => level.number <= this.get_Character().level );
            levels.forEach(level => {
                level.spellChoices.filter(choice => choice.level == spellLevel && choice.className == className).forEach(choice => {
                    //You have as many spell slots as you have spells (as a sorcerer).
                    spellslots += choice.available;
                })
            })
            return spellslots;
        } else {
            return 0;
        }
    }

    refocus() {
        let character = this.characterService.get_Character();
        let focusPoints = character.class.focusPoints;
        let maxFocusPoints = this.get_MaxFocusPoints();
        if (character.get_FeatsTaken(0, character.level, "Meditative Wellspring").length && (maxFocusPoints - focusPoints >= 3)) {
            character.class.focusPoints = Math.min(focusPoints + 3, this.get_MaxFocusPoints());
        } else if (character.get_FeatsTaken(0, character.level, "Meditative Focus").length && (maxFocusPoints - focusPoints >= 2)) {
            character.class.focusPoints = Math.min(focusPoints + 2, this.get_MaxFocusPoints());
        } else {
            character.class.focusPoints = Math.min(focusPoints + 1, this.get_MaxFocusPoints());
        }
        this.timeService.tick(this.characterService, 1000);
    }

    can_Cast(spell: Spell, gain: SpellGain) {
        return spell.can_Cast(this.characterService, gain);
    }

    on_Cast(gain: SpellGain, creature: string = "", spell: Spell, activated: boolean, level: number) {
        if (!level || level == -1) {
            level = Math.ceil(this.get_Character().level / 2)
        }
        if (gain.tradition.includes("Focus") && activated){
            let focusPoints = this.get_Character().class.focusPoints;
            this.characterService.get_Character().class.focusPoints = Math.min(focusPoints, this.get_MaxFocusPoints());
            this.characterService.get_Character().class.focusPoints -= 1;
        };
        if (gain.className == "Sorcerer" && !spell.traits.includes("Cantrip")) {
            this.get_Character().class.bloodline.spellSlotsUsed[level] += 1;
        }
        if (["Wizard", "Cleric", "Druid"].includes(gain.className) && !spell.traits.includes("Cantrip")) {
            //spend the spell (but keep it prepared)
        }
        this.spellsService.process_Spell(creature, this.characterService, this.itemsService, gain, spell, level, activated);
        this.characterService.set_Changed();
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
        this.finish_Loading();
    }

}
