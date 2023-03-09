import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy, HostBinding } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, Subject, Subscription, takeUntil } from 'rxjs';
import { Ability } from 'src/app/classes/Ability';
import { Creature } from 'src/app/classes/Creature';
import { AbilitiesDataService } from 'src/libs/shared/services/data/abilities-data.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { AbilityValuesService, CalculatedAbility } from 'src/libs/shared/services/ability-values/ability-values.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';

@Component({
    selector: 'app-abilities',
    templateUrl: './abilities.component.html',
    styleUrls: ['./abilities.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbilitiesComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes.Character | CreatureTypes.AnimalCompanion = CreatureTypes.Character;

    @HostBinding('class.minimized')
    private _combinedMinimized = false;

    public isMinimized$ = new BehaviorSubject<boolean>(false);

    private _isMinimized = false;
    private _forceMinimized = false;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;
    private readonly _destroyed$ = new Subject<true>();

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _abilitiesDataService: AbilitiesDataService,
        private readonly _ablityValuesService: AbilityValuesService,
        private readonly _refreshService: RefreshService,
    ) {
        super();

        SettingsService.settings$
            .pipe(
                takeUntil(this._destroyed$),
                map(settings => {
                    switch (this.creature) {
                        case CreatureTypes.AnimalCompanion:
                            return settings.companionMinimized;
                        default:
                            return settings.abilitiesMinimized;
                    }
                }),
                distinctUntilChanged(),
            )
            .subscribe(minimized => {
                this._isMinimized = minimized;
                this._combinedMinimized = this._isMinimized || this._forceMinimized;
                this.isMinimized$.next(this._combinedMinimized);
            });
    }

    @Input()
    public set forceMinimized(forceMinimized: boolean | undefined) {
        this._forceMinimized = forceMinimized ?? false;
        this._combinedMinimized = this._isMinimized || this._forceMinimized;
        this.isMinimized$.next(this._combinedMinimized);
    }

    public get shouldShowMinimizeButton(): boolean {
        return !this.forceMinimized && this.creature === CreatureTypes.Character;
    }

    private get _currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.settings.abilitiesMinimized = minimized;
    }

    public abilities(subset = 0): Array<Ability> {
        const all = 0;
        const firstThree = 1;
        const lastThree = 2;
        const thirdAbility = 2;

        switch (subset) {
            case all:
                return this._abilitiesDataService.abilities();
            case firstThree:
                return this._abilitiesDataService.abilities().filter((_ability, index) => index <= thirdAbility);
            case lastThree:
                return this._abilitiesDataService.abilities().filter((_ability, index) => index > thirdAbility);
            default:
                return this._abilitiesDataService.abilities();
        }
    }

    public calculateAbility(ability: Ability): CalculatedAbility {
        return this._ablityValuesService.calculate(ability, this._currentCreature);
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
        this._destroyed$.next(true);
        this._destroyed$.complete();
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['abilities', 'all', this.creature.toLowerCase()].includes(target)) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    view.creature.toLowerCase() === this.creature.toLowerCase() &&
                    ['abilities', 'all'].includes(view.target.toLowerCase())
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

}
