import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { AnimalCompanionsService } from 'src/app/services/animalcompanions.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { DisplayService } from 'src/app/services/display.service';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { Character } from 'src/app/classes/Character';
import { MenuState } from 'src/libs/shared/definitions/Types/menuState';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

@Component({
    selector: 'app-animal-companion',
    templateUrl: './animal-companion.component.html',
    styleUrls: ['./animal-companion.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimalCompanionComponent implements OnInit, OnDestroy {

    public hover = '';
    public isMobile = false;
    public CreatureTypesEnum = CreatureTypes;
    private _showMode = '';
    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _animalCompanionsService: AnimalCompanionsService,
    ) { }

    public get isMinimized(): boolean {
        return this._characterService.character.settings.companionMinimized;
    }

    public get character(): Character {
        return this._characterService.character;
    }

    public get stillLoading(): boolean {
        return (this._characterService.stillLoading || this._animalCompanionsService.stillLoading);
    }

    public get companionMenuState(): MenuState {
        return this._characterService.companionMenuState();
    }

    public get isCompanionAvailable(): boolean {
        return this._characterService.isCompanionAvailable();
    }

    @HostListener('window:resize', ['$event'])
    public onResize(): void {
        this._setMobile();
    }

    @HostListener('window:orientationchange', ['$event'])
    public onRotate(): void {
        this._setMobile();
    }

    public minimize(): void {
        this._characterService.character.settings.companionMinimized = !this._characterService.character.settings.companionMinimized;
        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'companion');
        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'abilities');
        this._refreshService.processPreparedChanges();
    }

    public toggleCompanionMenu(): void {
        this._characterService.toggleMenu(MenuNames.CompanionMenu);
    }

    public toggleShowMode(type: string): void {
        this._showMode = this._showMode === type ? '' : type;
    }

    public showMode(): string {
        return this._showMode;
    }

    public ngOnInit(): void {
        this._setMobile();
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['companion', 'all'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'companion' && ['companion', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _setMobile(): void {
        this.isMobile = DisplayService.isMobile;
    }

}
