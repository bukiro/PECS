import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Character } from 'src/app/classes/Character';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { MenuState } from 'src/libs/shared/definitions/types/menuState';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { DisplayService } from 'src/libs/shared/services/display/display.service';
import { MenuService } from 'src/libs/shared/services/menu/menu.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';

@Component({
    selector: 'app-animal-companion',
    templateUrl: './animal-companion.component.html',
    styleUrls: ['./animal-companion.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimalCompanionComponent implements OnInit, OnDestroy {

    public hover = '';
    public isMobile = false;
    public creatureTypesEnum = CreatureTypes;
    private _showMode = '';
    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _menuService: MenuService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
    ) { }

    public get isMinimized(): boolean {
        return CreatureService.character.settings.companionMinimized;
    }

    public get character(): Character {
        return CreatureService.character;
    }

    public get companionMenuState(): MenuState {
        return this._menuService.companionMenuState;
    }

    public get isCompanionAvailable(): boolean {
        return this._creatureAvailabilityService.isCompanionAvailable();
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
        CreatureService.character.settings.companionMinimized = !CreatureService.character.settings.companionMinimized;
        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'companion');
        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'abilities');
        this._refreshService.processPreparedChanges();
    }

    public toggleCompanionMenu(): void {
        this._menuService.toggleMenu(MenuNames.CompanionMenu);
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
