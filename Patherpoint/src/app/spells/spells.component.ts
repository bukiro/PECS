import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CharacterService } from '../character.service';
import { SortByPipe } from '../sortBy.pipe';
import { SpellsService } from '../spells.service';
import { SpellChoice } from '../SpellChoice';
import { Spell } from '../Spell';
import { TraitsService } from '../traits.service';
import { SpellCasting } from '../SpellCasting';
import { SpellchoiceComponent } from './spellchoice/spellchoice.component';

@Component({
    selector: 'app-spells',
    templateUrl: './spells.component.html',
    styleUrls: ['./spells.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellsComponent implements OnInit {

    public showSpell: string = "";
    public showChoice: string = "";
    public allowHeightened: boolean = false;
    public allowBorrow: boolean = false;
    public prepared: boolean = false;

    constructor(
        private changeDetector:ChangeDetectorRef,
        private characterService: CharacterService,
        private spellsService: SpellsService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.spellsMinimized = !this.characterService.get_Character().settings.spellsMinimized;
    }

    toggleSpellMenu() {
        this.characterService.toggleMenu("spells");
    }

    toggle_Spell(name: string) {
        if (this.showSpell == name) {
            this.showSpell = "";
        } else {
            this.showSpell = name;
        }
    }

    receive_ChoiceMessage(name: string) {
        this.toggle_Choice(name);
    }

    receive_SpellMessage(name: string) {
        this.toggle_Spell(name);
    }


    toggle_Choice(name: string) {
        if (this.showChoice == name) {
            this.showChoice = "";
        } else {
            this.showChoice = name;
        }
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

    need_Spellbook(casting: SpellCasting) {
        return casting.castingType == "Prepared" && casting.className == "Wizard";
    }

    apply_SpellSubstitution(casting: SpellCasting) {
        return casting.castingType == "Prepared" &&
            casting.className == "Wizard" &&
            this.get_Character().get_FeatsTaken(1, this.get_Character().level, "Spell Substitution").length > 0;
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.spellsService.get_Spells(name, type, tradition);
    }

    get_MaxSpellLevel() {
        return this.get_Character().get_SpellLevel();
    }

    get_SpellCastings() {
        let character = this.get_Character();
        return character.class.spellCasting.filter(casting => casting.charLevelAvailable && casting.charLevelAvailable <= character.level);
    }

    get_DynamicLevel(casting: SpellCasting, choice: SpellChoice) {
        //highestSpellLevel is used in the eval() process.
        let highestSpellLevel = 1;
        let Character = this.get_Character();
        function Skill_Level(name: string) {
            return this.characterService.get_Skills(Character, name)[0]?.level(Character) || 0;
        }
        //Get the available spell level of this casting. This is the higest spell level of the spell choices that are available at your character level.
        highestSpellLevel = Math.max(...casting.spellChoices.filter(spellChoice => spellChoice.charLevelAvailable <= Character.level).map(spellChoice => spellChoice.level));
        try {
            return parseInt(eval(choice.dynamicLevel));
        } catch (e) {
            console.log("Error parsing spell level requirement ("+choice.dynamicLevel+"): "+e)
            return 1;
        }
    }

    get_SpellChoices(casting: SpellCasting, levelNumber: number) {
        //Get all spellchoices that have this spell level and are available at this character level.
        return casting.spellChoices.filter(choice => choice.charLevelAvailable <= this.get_Character().level && 
            ((choice.level == levelNumber && !choice.dynamicLevel) || (choice.dynamicLevel && this.get_DynamicLevel(casting, choice) == levelNumber))
        )
    }

    get_SpellsTaken(minLevelNumber: number, maxLevelNumber: number, spellLevel: number, spellName: string, casting: SpellCasting, source: string = "", sourceId: string = "", locked: boolean = undefined) {
        return this.get_Character().get_SpellsTaken(this.characterService, minLevelNumber, maxLevelNumber, spellLevel, spellName, casting, "", "", "", source, sourceId, locked);
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
                if (["spells", "all", "Character"].includes(target)) {
                    this.changeDetector.detectChanges();
                }
            });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
