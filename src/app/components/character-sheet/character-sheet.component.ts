import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CharacterService } from 'src/app/services/character.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { DisplayService } from 'src/app/services/display.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { MenuState } from 'src/libs/shared/definitions/Types/menuState';

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

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _changeDetector: ChangeDetectorRef,
        public trackers: Trackers,
    ) { }

    public get stillLoading(): boolean {
        return this._characterService.stillLoading;
    }

    public get characterMinimized(): boolean {
        return this._characterService.character.settings.characterMinimized;
    }

    public get companionMinimized(): boolean {
        return this._characterService.character.settings.companionMinimized;
    }

    public get familiarMinimized(): boolean {
        return this._characterService.character.settings.familiarMinimized;
    }

    public get spellsMinimized(): boolean {
        return this._characterService.character.settings.spellsMinimized;
    }

    public get spellLibraryMinimized(): boolean {
        return this._characterService.character.settings.spelllibraryMinimized;
    }

    public get generalMinimized(): boolean {
        return this._characterService.character.settings.generalMinimized;
    }

    public get effectsMinimized(): boolean {
        return this._characterService.character.settings.effectsMinimized;
    }

    public get abilitiesMinimized(): boolean {
        return this._characterService.character.settings.abilitiesMinimized;
    }

    public get healthMinimized(): boolean {
        return this._characterService.character.settings.healthMinimized;
    }

    public get defenseMinimized(): boolean {
        return this._characterService.character.settings.defenseMinimized;
    }

    public get attacksMinimized(): boolean {
        return this._characterService.character.settings.attacksMinimized;
    }

    public get skillsMinimized(): boolean {
        return this._characterService.character.settings.skillsMinimized;
    }

    public get inventoryMinimized(): boolean {
        return this._characterService.character.settings.inventoryMinimized;
    }

    public get activitiesMinimized(): boolean {
        return this._characterService.character.settings.activitiesMinimized;
    }

    public get spellbookMinimized(): boolean {
        return this._characterService.character.settings.spellbookMinimized;
    }

    public get timeMinimized(): boolean {
        return this._characterService.character.settings.timeMinimized;
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

    public itemsMenuState(): MenuState {
        return this._characterService.itemsMenuState();
    }

    public craftingMenuState(): MenuState {
        return this._characterService.craftingMenuState();
    }

    public characterMenuState(): MenuState {
        return this._characterService.characterMenuState();
    }

    public companionMenuState(): MenuState {
        return this._characterService.companionMenuState();
    }

    public familiarMenuState(): MenuState {
        return this._characterService.familiarMenuState();
    }

    public spellsMenuState(): MenuState {
        return this._characterService.spellsMenuState();
    }

    public spellLibraryMenuState(): MenuState {
        return this._characterService.spellLibraryMenuState();
    }

    public conditionsMenuState(): MenuState {
        return this._characterService.conditionsMenuState();
    }

    public diceMenuState(): MenuState {
        return this._characterService.diceMenuState();
    }

    public companionAvailable(): boolean {
        return this._characterService.isCompanionAvailable();
    }

    public familiarAvailable(): boolean {
        return this._characterService.isFamiliarAvailable();
    }

    public attacksAndSpellsOrder(fightingStyle: 'attacks' | 'spells'): number {
        //Returns whether the fightingStyle (attacks or spells) should be first or second for this class (0 or 1).
        //This checks whether you have a primary spellcasting for your class from level 1, and if so, spells should be first.
        if (this._characterService.character.defaultSpellcasting()?.charLevelAvailable === 1) {
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
        if (this._characterService.stillLoading) {
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
