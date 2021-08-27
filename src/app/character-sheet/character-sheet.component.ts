import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CharacterService } from '../character.service';

@Component({
    selector: 'app-character-sheet',
    templateUrl: './character-sheet.component.html',
    styleUrls: ['./character-sheet.component.css'],
    animations: [
        trigger('slideInOut', [
            state('in', style({
                transform: 'translate3d(0,0,0)'
            })),
            state('out', style({
                transform: 'translate3d(-100%, 0, 0)'
            })),
            transition('in => out', animate('400ms ease-in-out')),
            transition('out => in', animate('400ms ease-in-out'))
        ]),
        trigger('slideInOutRight', [
            state('in', style({
                transform: 'translate3d(0,0,0)'
            })),
            state('out', style({
                transform: 'translate3d(+100%, 0, 0)'
            })),
            transition('in => out', animate('400ms ease-in-out')),
            transition('out => in', animate('400ms ease-in-out'))
        ]),
        trigger('slideInOutVert', [
            state('in', style({
                transform: 'translate3d(0,0,0)'
            })),
            state('out', style({
                transform: 'translate3d(0, -100%, 0)'
            })),
            transition('in => out', animate('400ms ease-in-out')),
            transition('out => in', animate('400ms ease-in-out'))
        ]),
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterSheetComponent implements OnInit {

    public showMode: string = "";
    public mobile: boolean = false;

    constructor(
        private characterService: CharacterService,
        private changeDetector: ChangeDetectorRef
    ) { }

    toggle_Mode(type: string) {
        if (this.showMode == type) {
            this.showMode = "";
        } else {
            this.showMode = type;
        }
    }

    get_ShowMode() {
        return this.showMode;
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    get_Darkmode() {
        return this.characterService.get_Darkmode();
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_ItemsMenuState() {
        return this.characterService.get_ItemsMenuState();
    }

    get_CraftingMenuState() {
        return this.characterService.get_CraftingMenuState();
    }

    get_CharacterMenuState() {
        return this.characterService.get_CharacterMenuState();
    }

    get_CompanionMenuState() {
        return this.characterService.get_CompanionMenuState();
    }

    get_FamiliarMenuState() {
        return this.characterService.get_FamiliarMenuState();
    }

    get_SpellsMenuState() {
        return this.characterService.get_SpellsMenuState();
    }

    get_SpellLibraryMenuState() {
        return this.characterService.get_SpellLibraryMenuState();
    }

    get_ConditionsMenuState() {
        return this.characterService.get_ConditionsMenuState();
    }

    get_DiceMenuState() {
        return this.characterService.get_DiceMenuState();
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }

    get_FamiliarAvailable() {
        return this.characterService.get_FamiliarAvailable();
    }

    get_CharacterMinimized() {
        return this.characterService.get_Character().settings.characterMinimized;
    }

    get_CompanionMinimized() {
        return this.characterService.get_Character().settings.companionMinimized;
    }

    get_FamiliarMinimized() {
        return this.characterService.get_Character().settings.familiarMinimized;
    }

    get_SpellsMinimized() {
        return this.characterService.get_Character().settings.spellsMinimized;
    }

    get_SpellLibraryMinimized() {
        return this.characterService.get_Character().settings.spelllibraryMinimized;
    }
    
    get_GeneralMinimized() {
        return this.characterService.get_Character().settings.generalMinimized;
    }

    get_EffectsMinimized() {
        return this.characterService.get_Character().settings.effectsMinimized;
    }

    get_AbilitiesMinimized() {
        return this.characterService.get_Character().settings.abilitiesMinimized;
    }

    get_HealthMinimized() {
        return this.characterService.get_Character().settings.healthMinimized;
    }

    get_DefenseMinimized() {
        return this.characterService.get_Character().settings.defenseMinimized;
    }

    get_AttacksMinimized() {
        return this.characterService.get_Character().settings.attacksMinimized;
    }

    get_SkillsMinimized() {
        return this.characterService.get_Character().settings.skillsMinimized;
    }

    get_InventoryMinimized() {
        return this.characterService.get_Character().settings.inventoryMinimized;
    }

    get_ActivitiesMinimized() {
        return this.characterService.get_Character().settings.activitiesMinimized;
    }

    get_SpellbookMinimized() {
        return this.characterService.get_Character().settings.spellbookMinimized;
    }

    get_TimeMinimized() {
        return this.characterService.get_Character().settings.timeMinimized;
    }

    get_ClassOrder(fightingStyle: string) {
        //Returns whether the fightingStyle (attacks or spells) should be first or second for this class (0 or 1).
        //This checks whether you have a primary spellcasting for your class from level 1, and if so, spells should be first.
        if (this.characterService.get_Character().get_DefaultSpellcasting()?.charLevelAvailable == 1) {
            switch (fightingStyle) {
                case "attacks":
                    return 1;
                case "spells":
                    return 0;
            }
        } else {
            switch (fightingStyle) {
                case "attacks":
                    return 0;
                case "spells":
                    return 1;
            }
        }
    }

    finish_Loading() {
        if (this.characterService.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (["character-sheet", "all", "character"].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == "character" && ["character-sheet", "all"].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.mobile = (window.screen.width <= 992);
        this.finish_Loading();
    }
    
    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.mobile = (window.screen.width <= 992);
    }

}
