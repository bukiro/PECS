import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy, HostBinding } from '@angular/core';
import { map, Subscription } from 'rxjs';
import { Ability } from 'src/app/classes/Ability';
import { Creature } from 'src/app/classes/Creature';
import { AbilitiesDataService } from 'src/libs/shared/services/data/abilities-data.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { AbilityValuesService, CalculatedAbility } from 'src/libs/shared/services/ability-values/ability-values.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

@Component({
    selector: 'app-abilities',
    templateUrl: './abilities.component.html',
    styleUrls: ['./abilities.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AbilitiesComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public forceMinimized?: boolean;

    @Input()
    public creature: CreatureTypes.Character | CreatureTypes.AnimalCompanion = CreatureTypes.Character;

    private _isMinimized = false;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _abilitiesDataService: AbilitiesDataService,
        private readonly _ablityValuesService: AbilityValuesService,
        private readonly _refreshService: RefreshService,
    ) {
        super();

        CreatureService.settings$
            .pipe(
                map(settings => {
                    switch (this.creature) {
                        case CreatureTypes.AnimalCompanion:
                            return settings.companionMinimized;
                        default:
                            return settings.inventoryMinimized;
                    }
                }),
            )
            .subscribe(minimized => {
                this._isMinimized = minimized;
            });
    }

    @HostBinding('class.minimized')
    public get isMinimized(): boolean {
        return this.forceMinimized || this._isMinimized;
    }

    public set isMinimized(minimized: boolean) {
        CreatureService.settings.inventoryMinimized = minimized;
    }

    public get shouldShowMinimizeButton(): boolean {
        return !this.forceMinimized && this.creature === CreatureTypes.Character;
    }

    private get _currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
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

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

}
