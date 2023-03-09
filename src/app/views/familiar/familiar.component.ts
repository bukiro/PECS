import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, HostBinding } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, Subject, Subscription, takeUntil } from 'rxjs';
import { Character } from 'src/app/classes/Character';
import { Familiar } from 'src/app/classes/Familiar';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { DisplayService } from 'src/libs/shared/services/display/display.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { MenuState } from 'src/libs/shared/definitions/types/menuState';
import { MenuService } from 'src/libs/shared/services/menu/menu.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';

@Component({
    selector: 'app-familiar',
    templateUrl: './familiar.component.html',
    styleUrls: ['./familiar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamiliarComponent implements OnInit, OnDestroy {

    @HostBinding('class.minimized')
    private _isMinimized = false;

    public isMobile = false;
    public creatureTypesEnum = CreatureTypes;

    public isMinimized$ = new BehaviorSubject<boolean>(false);

    private _showMode = '';
    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;
    private readonly _destroyed$ = new Subject<true>();

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _menuService: MenuService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
    ) {
        SettingsService.settings$
            .pipe(
                takeUntil(this._destroyed$),
                map(settings => settings.familiarMinimized),
                distinctUntilChanged(),
            )
            .subscribe(minimized => {
                this._isMinimized = minimized;
                this.isMinimized$.next(this._isMinimized);
            });
    }

    public get familiarMenuState(): MenuState {
        return this._menuService.familiarMenuState;
    }

    public get character(): Character {
        return CreatureService.character;
    }

    public get isFamiliarAvailable(): boolean {
        return this._creatureAvailabilityService.isFamiliarAvailable();
    }

    public get familiar(): Familiar {
        return CreatureService.familiar;
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.settings.familiarMinimized = minimized;
    }

    public toggleFamiliarMenu(): void {
        this._menuService.toggleMenu(MenuNames.FamiliarMenu);
    }

    public toggleShownMode(type: string): void {
        this._showMode = this._showMode === type ? '' : type;
    }

    public shownMode(): string {
        return this._showMode;
    }

    public areFamiliarAbilitiesFinished(): boolean {
        const choice = this.familiar.abilities;
        let available = choice.available;

        this._creatureEffectsService.absoluteEffectsOnThis(this.character, 'Familiar Abilities').forEach(effect => {
            available = parseInt(effect.setValue, 10);
        });
        this._creatureEffectsService.relativeEffectsOnThis(this.character, 'Familiar Abilities').forEach(effect => {
            available += parseInt(effect.value, 10);
        });

        return choice.feats.length >= available;
    }

    public ngOnInit(): void {
        this._setMobile();
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['familiar', 'all'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'familiar' && ['familiar', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
        this._destroyed$.next(true);
        this._destroyed$.complete();
    }

    private _setMobile(): void {
        this.isMobile = DisplayService.isMobile;
    }

}
