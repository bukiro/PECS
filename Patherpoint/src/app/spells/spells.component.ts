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

    private showItem: string = "";
    private showList: string = "";
    public allowHeightened: boolean = false;

    constructor(
        private changeDetector:ChangeDetectorRef,
        private characterService: CharacterService,
        private spellsService: SpellsService,
        private traitsService: TraitsService,
        private sortByPipe: SortByPipe
    ) { }

    minimize() {
        this.characterService.get_Character().settings.spellsMinimized = !this.characterService.get_Character().settings.spellsMinimized;
    }

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

    get_ShowItem() {
        return this.showItem;
    }

    get_ShowList() {
        return this.showList;
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

    get_SpellChoices(levelNumber: number) {
        //Get all spellchoices from all character levels that have this spell level
        return [].concat(...this.get_Character().class.levels
            .filter(level => level.number <= this.get_Character().level)
                .map(level => level.spellChoices.filter(choice => choice.level == levelNumber)))
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
            allSpells = allSpells.filter(spell => choice.filter.indexOf(spell.name) > -1)
        }
        let spells: Spell[] = [];
        switch (choice.tradition) {
            case "Focus":
                spells.push(...allSpells.filter(spell => spell.traits.indexOf(character.class.name) > -1));
                break;
            case "Sorcerer":
                let tradition = character.class.bloodline.spellList;
                //Get all spells of the tradition or of the bloodline granted spells
                spells.push(...allSpells.filter(spell => spell.traditions.indexOf(tradition) > -1 || character.class.bloodline.grantedSpells.map(gain => gain.name).indexOf(spell.name) > -1));
                break;
            default:
                spells.push(...allSpells.filter(spell => spell.traditions.indexOf(tradition) > -1));
                break;
        }
        if (spells.length) {
            if (choice.level == 0) {
                spells = spells.filter(spell => spell.traits.indexOf("Cantrip") > -1 || this.spellTakenByThis(spell, choice));
            } else {
                spells = spells.filter(spell => spell.traits.indexOf("Cantrip") == -1 || this.spellTakenByThis(spell, choice));
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
        //Are the basic requirements (level, ability, feat etc) not met?
        if (!spell.canChoose(this.characterService, spellLevel)) {
            reasons.push("The requirements are not met.")
        }
        //Has it already been taken up to this level, and was that not by this FeatChoice?
        if (spell.have(this.characterService, spellLevel) && !this.spellTakenByThis(spell, choice)) {
            reasons.push("You already have this spell.");
        }
        //Has it generally been taken more than once, and this is one time?
        if (spell.have(this.characterService, spellLevel) > 1 && this.spellTakenByThis(spell, choice)) {
            reasons.push("Spells cannot be taken more than once!");
        }
        return reasons;
    }

    spellTakenByThis(spell: Spell, choice: SpellChoice) {
        return this.get_SpellsTaken(1, 20, -1, spell.name, choice.source, choice.id).length > 0;
    }

    get_SpellsTaken(minLevelNumber: number, maxLevelNumber: number, spellLevel: number, spellName: string, source: string = "", sourceId: string = "", locked: boolean = undefined) {
        return this.get_Character().get_SpellsTaken(this.characterService, minLevelNumber, maxLevelNumber, spellLevel, spellName, "", "", source, sourceId, locked);
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
