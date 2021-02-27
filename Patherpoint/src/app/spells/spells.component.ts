import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CharacterService } from '../character.service';
import { SpellsService } from '../spells.service';
import { SpellChoice } from '../SpellChoice';
import { SpellCasting } from '../SpellCasting';

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
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private spellsService: SpellsService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.spellsMinimized = !this.characterService.get_Character().settings.spellsMinimized;
    }

    get_Minimized() {
        return this.characterService.get_Character().settings.spellsMinimized;
    }

    toggleSpellMenu() {
        this.characterService.toggle_Menu("spells");
    }

    get_SpellsMenuState() {
        return this.characterService.get_SpellsMenuState();
    }

    toggle_Spell(name: string) {
        if (this.showSpell == name) {
            this.showSpell = "";
        } else {
            this.showSpell = name;
        }
    }

    toggle_Choice(name: string) {
        if (this.showChoice == name) {
            this.showChoice = "";
        } else {
            this.showChoice = name;
        }
    }

    receive_ChoiceMessage(name: string) {
        this.toggle_Choice(name);
    }

    receive_SpellMessage(name: string) {
        this.toggle_Spell(name);
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

    need_Spellbook(casting: SpellCasting) {
        return casting.castingType == "Prepared" && casting.className == "Wizard";
    }

    apply_SpellSubstitution(casting: SpellCasting) {
        return casting.castingType == "Prepared" &&
            casting.className == "Wizard" &&
            this.get_Character().get_FeatsTaken(1, this.get_Character().level, "Spell Substitution").length > 0;
    }

    apply_ReprepareSpell(casting: SpellCasting) {
        return casting.castingType == "Prepared" &&
            casting.className == "Wizard" &&
            this.get_Character().get_FeatsTaken(1, this.get_Character().level, "Reprepare Spell").length > 0;
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.spellsService.get_Spells(name, type, tradition);
    }

    get_MaxSpellLevel() {
        return this.get_Character().get_SpellLevel();
    }

    get_SpellCastings() {
        let character = this.get_Character();
        return character.class.spellCasting.filter(casting => casting.charLevelAvailable && casting.charLevelAvailable <= character.level)
            .sort(function (a, b) {
                if (a.tradition > b.tradition) {
                    return 1;
                }
                if (a.tradition < b.tradition) {
                    return -1;
                }
                return 0;
            }).sort(function (a, b) {
                if (a.className > b.className) {
                    return 1;
                }
                if (a.className < b.className) {
                    return -1;
                }
                return 0;
            }).sort(function (a, b) {
                if (a.castingType > b.castingType || (b.castingType == "Innate" ? a.castingType != "Innate" : false)) {
                    return 1;
                }
                if (a.castingType < b.castingType || (a.castingType == "Innate" ? b.castingType != "Innate" : false)) {
                    return -1;
                }
                return 0;
            })
    }

    get_DynamicLevel(casting: SpellCasting, choice: SpellChoice) {
        return this.spellsService.get_DynamicSpellLevel(casting, choice, this.characterService);
    }

    get_SpellChoices(casting: SpellCasting, levelNumber: number) {
        //Get all spellchoices that have this spell level and are available at this character level.
        return casting.spellChoices.filter(choice => choice.charLevelAvailable <= this.get_Character().level && !choice.showOnSheet &&
            ((choice.level == levelNumber && !choice.dynamicLevel) || (choice.dynamicLevel && this.get_DynamicLevel(casting, choice) == levelNumber))
        )
    }

    get_SpellsTaken(minLevelNumber: number, maxLevelNumber: number, spellLevel: number, spellName: string, casting: SpellCasting, source: string = "", sourceId: string = "", locked: boolean = undefined) {
        let cantripAllowed: boolean = (spellLevel == 0);
        return this.get_Character().get_SpellsTaken(this.characterService, minLevelNumber, maxLevelNumber, spellLevel, spellName, casting, "", "", "", source, sourceId, locked, false, cantripAllowed);
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
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature == "Character" && ["spells", "all"].includes(view.target)) {
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
