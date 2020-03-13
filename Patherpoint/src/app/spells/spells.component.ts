import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CharacterService } from '../character.service';
import { SortByPipe } from '../sortBy.pipe';
import { SpellsService } from '../spells.service';
import { SpellChoice } from '../SpellChoice';
import { Spell } from '../Spell';
import { TraitsService } from '../traits.service';

@Component({
    selector: 'app-spells',
    templateUrl: './spells.component.html',
    styleUrls: ['./spells.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellsComponent implements OnInit {

    public showItem: string = "";
    public showList: string = "";

    constructor(
        private changeDetector:ChangeDetectorRef,
        public characterService: CharacterService,
        public spellsService: SpellsService,
        public traitsService: TraitsService,
        private sortByPipe: SortByPipe
    ) { }

    toggleSpellMenu() {
        this.characterService.toggleMenu("spells");
    }

    toggle_Item(name: string) {
        if (this.showItem == name) {
            this.showItem = "";
        } else {
            this.showItem = name;
        }
    }
    toggle_List(name: string) {
        if (this.showList == name) {
            this.showList = "";
        } else {
            this.showList = name;
        }
    }

    get_showItem() {
        return this.showItem;
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

    get_AvailableSpells(choice: SpellChoice, get_unavailable: boolean = false) {
        let character = this.get_Character()
        let allSpells = this.spellsService.get_Spells();
        if (choice.filter.length) {
            allSpells = allSpells.filter(spell => choice.filter.indexOf(spell.name) > -1)
        }
        let spells: Spell[] = [];
        switch (choice.tradition) {
            case "Focus":
                spells.push(...allSpells.filter(spell => spell.traits.indexOf(character.class.name) > -1));
                break;
            default:
                spells.push(...allSpells.filter(spell => spell.traditions.indexOf(choice.tradition) > -1));
                break;
        }
        if (spells.length) {
            if (get_unavailable && choice.spells.length < choice.available) {
                let unavailableSpells: Spell[] = spells.filter(spell => 
                    (this.cannotTake(spell, choice).length > 0)
                )
                return this.sortByPipe.transform(unavailableSpells, "asc", "name")
            } else if (!get_unavailable && choice.spells.length < choice.available) {
                let availableSpells: Spell[] = spells.filter(spell => 
                    this.cannotTake(spell, choice).length == 0 || this.spellTakenByThis(spell, choice)
                )
                return this.sortByPipe.transform(availableSpells, "asc", "name")
            } else if (!get_unavailable) {
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
        let levelNumber = parseInt(choice.id.split("-")[0]);
        let spellLevel = levelNumber;
        let reasons: string[] = [];
        //Are the basic requirements (level, ability, feat etc) not met?
        if (!spell.canChoose(this.characterService, spellLevel)) {
            reasons.push("The requirements are not met.")
        }
        //Has it already been taken up to this level, and was that not by this FeatChoice?
        if (spell.have(this.characterService, levelNumber) && !this.spellTakenByThis(spell, choice)) {
            reasons.push("You already have this spell.");
        }
        //Has it generally been taken more than once, and this is one time?
        if (spell.have(this.characterService, levelNumber) > 1 && this.spellTakenByThis(spell, choice)) {
            reasons.push("Spells cannot be taken more than once!");
        }
        //Has it been taken on a higher level (that is, not up to now, but up to Level 20)?
        if (!spell.have(this.characterService, levelNumber) && spell.have(this.characterService, 20)) {
            reasons.push("This spell has been taken on a higher level.");
        }
        return reasons;
    }

    spellTakenByThis(spell: Spell, choice: SpellChoice) {
        let levelNumber = parseInt(choice.id.split("-")[0]);
        return this.get_SpellsTaken(levelNumber, levelNumber, spell.name, choice.source, choice.id).length > 0;
    }

    get_SpellsTaken(minLevelNumber: number, maxLevelNumber: number, spellName: string, source: string = "", sourceId: string = "", locked: boolean = undefined) {
        return this.get_Character().get_SpellsTaken(minLevelNumber, maxLevelNumber, spellName, "", "", source, sourceId, locked);
    }

    on_SpellTaken(spellName: string, taken: boolean, choice: SpellChoice, locked: boolean) {
        if (taken && (choice.spells.length == choice.available - 1)) { this.showList=""; }
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
        this.finish_Loading();
    }

}
