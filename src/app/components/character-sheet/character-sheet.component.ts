import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CharacterService } from 'src/app/services/character.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-character-sheet',
    templateUrl: './character-sheet.component.html',
    styleUrls: ['./character-sheet.component.css'],
    animations: [
        trigger('slideInOut', [
            state('in', style({
                transform: 'translate3d(0,0,0)',
            })),
            state('out', style({
                transform: 'translate3d(-100%, 0, 0)',
            })),
            transition('in => out', animate('400ms ease-in-out')),
            transition('out => in', animate('400ms ease-in-out')),
        ]),
        trigger('slideInOutRight', [
            state('in', style({
                transform: 'translate3d(0,0,0)',
            })),
            state('out', style({
                transform: 'translate3d(+100%, 0, 0)',
            })),
            transition('in => out', animate('400ms ease-in-out')),
            transition('out => in', animate('400ms ease-in-out')),
        ]),
        trigger('slideInOutVert', [
            state('in', style({
                transform: 'translate3d(0,0,0)',
            })),
            state('out', style({
                transform: 'translate3d(0, -100%, 0)',
            })),
            transition('in => out', animate('400ms ease-in-out')),
            transition('out => in', animate('400ms ease-in-out')),
        ]),
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSheetComponent implements OnInit, OnDestroy {

    public showMode = '';
    public mobile = false;

    constructor(
        private readonly characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly changeDetector: ChangeDetectorRef,
    ) { }

    toggle_Mode(type: string) {
        if (this.showMode == type) {
            this.showMode = '';
        } else {
            this.showMode = type;
        }
    }

    get_ShowMode() {
        return this.showMode;
    }

    public still_loading(): boolean {
        return this.characterService.stillLoading;
    }

    get_Darkmode() {
        return this.characterService.darkmode();
    }

    trackByIndex(index: number): number {
        return index;
    }

    get_ItemsMenuState() {
        return this.characterService.itemsMenuState();
    }

    get_CraftingMenuState() {
        return this.characterService.craftingMenuState();
    }

    get_CharacterMenuState() {
        return this.characterService.characterMenuState();
    }

    get_CompanionMenuState() {
        return this.characterService.companionMenuState();
    }

    get_FamiliarMenuState() {
        return this.characterService.familiarMenuState();
    }

    get_SpellsMenuState() {
        return this.characterService.spellsMenuState();
    }

    get_SpellLibraryMenuState() {
        return this.characterService.spellLibraryMenuState();
    }

    get_ConditionsMenuState() {
        return this.characterService.conditionsMenuState();
    }

    get_DiceMenuState() {
        return this.characterService.diceMenuState();
    }

    get_CompanionAvailable() {
        return this.characterService.isCompanionAvailable();
    }

    get_FamiliarAvailable() {
        return this.characterService.isFamiliarAvailable();
    }

    get_CharacterMinimized() {
        return this.characterService.character().settings.characterMinimized;
    }

    get_CompanionMinimized() {
        return this.characterService.character().settings.companionMinimized;
    }

    get_FamiliarMinimized() {
        return this.characterService.character().settings.familiarMinimized;
    }

    get_SpellsMinimized() {
        return this.characterService.character().settings.spellsMinimized;
    }

    get_SpellLibraryMinimized() {
        return this.characterService.character().settings.spelllibraryMinimized;
    }

    get_GeneralMinimized() {
        return this.characterService.character().settings.generalMinimized;
    }

    get_EffectsMinimized() {
        return this.characterService.character().settings.effectsMinimized;
    }

    get_AbilitiesMinimized() {
        return this.characterService.character().settings.abilitiesMinimized;
    }

    get_HealthMinimized() {
        return this.characterService.character().settings.healthMinimized;
    }

    get_DefenseMinimized() {
        return this.characterService.character().settings.defenseMinimized;
    }

    get_AttacksMinimized() {
        return this.characterService.character().settings.attacksMinimized;
    }

    get_SkillsMinimized() {
        return this.characterService.character().settings.skillsMinimized;
    }

    get_InventoryMinimized() {
        return this.characterService.character().settings.inventoryMinimized;
    }

    get_ActivitiesMinimized() {
        return this.characterService.character().settings.activitiesMinimized;
    }

    get_SpellbookMinimized() {
        return this.characterService.character().settings.spellbookMinimized;
    }

    get_TimeMinimized() {
        return this.characterService.character().settings.timeMinimized;
    }

    get_ClassOrder(fightingStyle: string) {
        //Returns whether the fightingStyle (attacks or spells) should be first or second for this class (0 or 1).
        //This checks whether you have a primary spellcasting for your class from level 1, and if so, spells should be first.
        if (this.characterService.character().defaultSpellcasting()?.charLevelAvailable == 1) {
            switch (fightingStyle) {
                case 'attacks':
                    return 1;
                case 'spells':
                    return 0;
            }
        } else {
            switch (fightingStyle) {
                case 'attacks':
                    return 0;
                case 'spells':
                    return 1;
            }
        }
    }

    finish_Loading() {
        if (this.characterService.stillLoading) {
            setTimeout(() => this.finish_Loading(), 500);
        } else {
            this.changeSubscription = this.refreshService.componentChanged$
                .subscribe(target => {
                    if (['character-sheet', 'all', 'character'].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.detailChanged$
                .subscribe(view => {
                    if (view.creature.toLowerCase() == 'character' && ['character-sheet', 'all'].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });

            return true;
        }
    }

    set_Mobile() {
        if (this.characterService.isMobileView() != this.mobile) {
            this.toggle_Mode('');
            this.mobile = !this.mobile;
        }
    }

    public ngOnInit(): void {
        this.set_Mobile();
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

    @HostListener('window:resize', ['$event'])
    onResize() {
        this.set_Mobile();
    }

    @HostListener('window:orientationchange', ['$event'])
    onRotate() {
        this.set_Mobile();
    }

}
