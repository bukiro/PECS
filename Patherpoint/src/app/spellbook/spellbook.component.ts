import { Component, OnInit } from '@angular/core';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';
import { Effect } from '../Effect';
import { Spell } from '../Spell';
import { TraitsService } from '../traits.service';
import { SpellsService } from '../spells.service';
import { SpellGain } from '../SpellGain';
import { ItemsService } from '../items.service';
import { TimeService } from '../time.service';

@Component({
    selector: 'app-spellbook',
    templateUrl: './spellbook.component.html',
    styleUrls: ['./spellbook.component.css']
})
export class SpellbookComponent implements OnInit {

    private showSpell: number = 0;
    private id: number = 0;
    public hover: number = 0;

    constructor(
        public characterService: CharacterService,
        private effectsService: EffectsService,
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
            document.getElementById("spellbook").style.gridRow = "span "+this.characterService.get_Span("spellbook-height");
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

    still_loading() {
        return this.characterService.still_loading();
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    toggleSpellsMenu() {
        this.characterService.toggleMenu('spells');
    }

    get_FocusSpells() {
        this.id = 1000;
        let character = this.characterService.get_Character();
        return character.get_SpellsTaken(1, character.level, "", "", "Focus");
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
        //this.characterService.set_Changed();
    }

    on_Cast(gain: SpellGain, spell: Spell, activated: boolean) {
        if (gain.tradition.indexOf("Focus") > -1 && activated){
            let focusPoints = this.characterService.get_Character().class.focusPoints;
            this.characterService.get_Character().class.focusPoints = Math.min(focusPoints, this.get_MaxFocusPoints());
            this.characterService.get_Character().class.focusPoints -= 1;
        };
        this.spellsService.process_Spell(this.characterService, this.itemsService, gain, spell, activated);
        this.characterService.set_Changed();
    }

    ngOnInit() {
    }

}
