import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Character } from 'src/app/classes/Character';
import { Familiar } from 'src/app/classes/Familiar';
import { CharacterService } from 'src/app/services/character.service';
import { DisplayService } from 'src/app/services/display.service';
import { EffectsService } from 'src/app/services/effects.service';
import { FamiliarsService } from 'src/app/services/familiars.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { MenuState } from 'src/libs/shared/definitions/Types/menuState';
import { Trackers } from 'src/libs/shared/util/trackers';

@Component({
    selector: 'app-familiar',
    templateUrl: './familiar.component.html',
    styleUrls: ['./familiar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamiliarComponent implements OnInit, OnDestroy {

    public isMobile = false;
    public CreatureTypesEnum = CreatureTypes;

    private _showMode = '';
    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _familiarsService: FamiliarsService,
        private readonly _effectsService: EffectsService,
        public trackers: Trackers,
    ) { }

    public get stillLoading(): boolean {
        return (this._characterService.stillLoading || this._familiarsService.stillLoading);
    }

    public get isMinimized(): boolean {
        return this._characterService.character.settings.familiarMinimized;
    }

    public get familiarMenuState(): MenuState {
        return this._characterService.familiarMenuState();
    }

    public get character(): Character {
        return this._characterService.character;
    }

    public get isFamiliarAvailable(): boolean {
        return this._characterService.isFamiliarAvailable();
    }

    public get familiar(): Familiar {
        return this._characterService.familiar;
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
        this._characterService.character.settings.familiarMinimized = !this._characterService.character.settings.familiarMinimized;
        this._refreshService.setComponentChanged('Familiar');
    }

    public toggleFamiliarMenu(): void {
        this._characterService.toggleMenu(MenuNames.FamiliarMenu);
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

        this._effectsService.absoluteEffectsOnThis(this.character, 'Familiar Abilities').forEach(effect => {
            available = parseInt(effect.setValue, 10);
        });
        this._effectsService.relativeEffectsOnThis(this.character, 'Familiar Abilities').forEach(effect => {
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
    }

    private _setMobile(): void {
        this.isMobile = DisplayService.isMobile;
    }

}
