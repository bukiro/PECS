import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, Input } from '@angular/core';
import { distinctUntilChanged, map, Observable, Subscription, takeUntil } from 'rxjs';
import { Character } from 'src/app/classes/Character';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { MenuService } from 'src/libs/shared/services/menu/menu.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseCardComponent } from 'src/libs/shared/util/components/base-card/base-card.component';
import { IsMobileMixin } from 'src/libs/shared/util/mixins/is-mobile-mixin';

@Component({
    selector: 'app-animal-companion',
    templateUrl: './animal-companion.component.html',
    styleUrls: ['./animal-companion.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimalCompanionComponent extends IsMobileMixin(BaseCardComponent) implements OnInit, OnDestroy {

    public hover = '';
    public creatureTypesEnum = CreatureTypes;

    public isMenuOpen$: Observable<boolean>;

    private _showMode = '';
    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _menuService: MenuService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
    ) {
        super();

        SettingsService.settings$
            .pipe(
                takeUntil(this._destroyed$),
                map(settings => settings.companionMinimized),
                distinctUntilChanged(),
            )
            .subscribe(minimized => {
                this._updateMinimized({ bySetting: minimized });
            });

        this.isMenuOpen$ = MenuService.sideMenuState$
            .pipe(
                map(menuState => menuState === MenuNames.CompanionMenu),
                distinctUntilChanged(),
            );
    }

    @Input()
    public set forceMinimized(forceMinimized: boolean | undefined) {
        this._updateMinimized({ forced: forceMinimized ?? false });
    }

    public get character(): Character {
        return CreatureService.character;
    }

    public get isCompanionAvailable(): boolean {
        return this._creatureAvailabilityService.isCompanionAvailable();
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.settings.companionMinimized = minimized;
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
        this._destroy();
    }

}
