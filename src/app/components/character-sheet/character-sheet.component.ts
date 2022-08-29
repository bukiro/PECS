import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CreatureService } from 'src/app/services/character.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { DisplayService } from 'src/app/core/services/display/display.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { MenuState } from 'src/libs/shared/definitions/Types/menuState';
import { MenuService } from 'src/app/core/services/menu/menu.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { StatusService } from 'src/app/core/services/status/status.service';

const slideInOutTrigger = trigger('slideInOut', [
    state('in', style({
        transform: 'translate3d(0,0,0)',
    })),
    state('out', style({
        transform: 'translate3d(-100%, 0, 0)',
    })),
    transition('in => out', animate('400ms ease-in-out')),
    transition('out => in', animate('400ms ease-in-out')),
]);
const slideInOutRightTrigger = trigger('slideInOutRight', [
    state('in', style({
        transform: 'translate3d(0,0,0)',
    })),
    state('out', style({
        transform: 'translate3d(+100%, 0, 0)',
    })),
    transition('in => out', animate('400ms ease-in-out')),
    transition('out => in', animate('400ms ease-in-out')),
]);
const slideInOutVertical = trigger('slideInOutVert', [
    state('in', style({
        transform: 'translate3d(0,0,0)',
    })),
    state('out', style({
        transform: 'translate3d(0, -100%, 0)',
    })),
    transition('in => out', animate('400ms ease-in-out')),
    transition('out => in', animate('400ms ease-in-out')),
]);

@Component({
    selector: 'app-character-sheet',
    templateUrl: './character-sheet.component.html',
    styleUrls: ['./character-sheet.component.scss'],
    animations: [
        slideInOutTrigger,
        slideInOutRightTrigger,
        slideInOutVertical,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSheetComponent implements OnInit, OnDestroy {

    public showMode = '';
    public mobile = false;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _menuService: MenuService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        public trackers: Trackers,
    ) { }

    public get stillLoading(): boolean {
        return StatusService.isLoadingCharacter;
    }

    public get characterMinimized(): boolean {
        return CreatureService.character.settings.characterMinimized;
    }

    public get companionMinimized(): boolean {
        return CreatureService.character.settings.companionMinimized;
    }

    public get familiarMinimized(): boolean {
        return CreatureService.character.settings.familiarMinimized;
    }

    public get spellsMinimized(): boolean {
        return CreatureService.character.settings.spellsMinimized;
    }

    public get spellLibraryMinimized(): boolean {
        return CreatureService.character.settings.spelllibraryMinimized;
    }

    public get generalMinimized(): boolean {
        return CreatureService.character.settings.generalMinimized;
    }

    public get effectsMinimized(): boolean {
        return CreatureService.character.settings.effectsMinimized;
    }

    public get abilitiesMinimized(): boolean {
        return CreatureService.character.settings.abilitiesMinimized;
    }

    public get healthMinimized(): boolean {
        return CreatureService.character.settings.healthMinimized;
    }

    public get defenseMinimized(): boolean {
        return CreatureService.character.settings.defenseMinimized;
    }

    public get attacksMinimized(): boolean {
        return CreatureService.character.settings.attacksMinimized;
    }

    public get skillsMinimized(): boolean {
        return CreatureService.character.settings.skillsMinimized;
    }

    public get inventoryMinimized(): boolean {
        return CreatureService.character.settings.inventoryMinimized;
    }

    public get activitiesMinimized(): boolean {
        return CreatureService.character.settings.activitiesMinimized;
    }

    public get spellbookMinimized(): boolean {
        return CreatureService.character.settings.spellbookMinimized;
    }

    public get timeMinimized(): boolean {
        return CreatureService.character.settings.timeMinimized;
    }

    public get itemsMenuState(): MenuState {
        return this._menuService.itemsMenuState;
    }

    public get craftingMenuState(): MenuState {
        return this._menuService.craftingMenuState;
    }

    public get characterMenuState(): MenuState {
        return this._menuService.characterMenuState;
    }

    public get companionMenuState(): MenuState {
        return this._menuService.companionMenuState;
    }

    public get familiarMenuState(): MenuState {
        return this._menuService.familiarMenuState;
    }

    public get spellsMenuState(): MenuState {
        return this._menuService.spellsMenuState;
    }

    public get spellLibraryMenuState(): MenuState {
        return this._menuService.spellLibraryMenuState;
    }

    public get conditionsMenuState(): MenuState {
        return this._menuService.conditionsMenuState;
    }

    public get diceMenuState(): MenuState {
        return this._menuService.diceMenuState;
    }

    @HostListener('window:resize', ['$event'])
    public onResize(): void {
        this._setMobile();
        DisplayService.setPageHeight();
    }

    @HostListener('window:orientationchange', ['$event'])
    public onRotate(): void {
        this._setMobile();
        DisplayService.setPageHeight();
    }

    public toggleShownMode(type: string): void {
        this.showMode = this.showMode === type ? '' : type;
    }

    public shownMode(): string {
        return this.showMode;
    }

    public companionAvailable(): boolean {
        return this._creatureAvailabilityService.isCompanionAvailable();
    }

    public familiarAvailable(): boolean {
        return this._creatureAvailabilityService.isFamiliarAvailable();
    }

    public attacksAndSpellsOrder(fightingStyle: 'attacks' | 'spells'): number {
        //Returns whether the fightingStyle (attacks or spells) should be first or second for this class (0 or 1).
        //This checks whether you have a primary spellcasting for your class from level 1, and if so, spells should be first.
        if (CreatureService.character.class.defaultSpellcasting()?.charLevelAvailable === 1) {
            return fightingStyle === 'attacks' ? 1 : 0;
        } else {
            return fightingStyle === 'spells' ? 1 : 0;
        }
    }

    public ngOnInit(): void {
        this._setMobile();
        this._subscribeToChanges();
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _subscribeToChanges(): void {
        if (this.stillLoading) {
            setTimeout(() => this._subscribeToChanges(), Defaults.waitForServiceDelay);
        } else {
            this._changeSubscription = this._refreshService.componentChanged$
                .subscribe(target => {
                    if (['character-sheet', 'all', 'character'].includes(target.toLowerCase())) {
                        this._changeDetector.detectChanges();
                    }
                });
            this._viewChangeSubscription = this._refreshService.detailChanged$
                .subscribe(view => {
                    if (view.creature.toLowerCase() === 'character' && ['character-sheet', 'all'].includes(view.target.toLowerCase())) {
                        this._changeDetector.detectChanges();
                    }
                });
        }
    }

    private _setMobile(): void {
        if (DisplayService.isMobile !== this.mobile) {
            this.toggleShownMode('');
            this.mobile = !this.mobile;
        }
    }

}
