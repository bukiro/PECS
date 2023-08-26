import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { Creature } from 'src/app/classes/Creature';
import { DiceService } from 'src/libs/shared/services/dice/dice.service';
import { DiceResult } from 'src/app/classes/DiceResult';
import { FoundryVTTIntegrationService } from 'src/libs/shared/services/foundry-vtt-integration/foundry-vtt-integration.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { combineLatest, debounceTime, distinctUntilChanged, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { HealthService } from 'src/libs/shared/services/health/health.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { Store } from '@ngrx/store';
import { selectTopMenu } from 'src/libs/store/menu/menu.selectors';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { toggleTopMenu } from 'src/libs/store/menu/menu.actions';

const defaultDiceNum = 5;

@Component({
    selector: 'app-dice',
    templateUrl: './dice.component.html',
    styleUrls: ['./dice.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiceComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    public diceNum = defaultDiceNum;
    public bonus = 0;

    public isMenuOpen$: Observable<boolean>;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _diceService: DiceService,
        private readonly _integrationsService: FoundryVTTIntegrationService,
        private readonly _healthService: HealthService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _creatureService: CreatureService,
        private readonly _store$: Store,
    ) {
        super();

        this.isMenuOpen$ = _store$.select(selectTopMenu)
            .pipe(
                map(menuState => menuState === MenuNames.DiceMenu),
                distinctUntilChanged(),
                switchMap(isMenuOpen => isMenuOpen
                    ? of(isMenuOpen)
                    : of(isMenuOpen)
                        .pipe(
                            debounceTime(Defaults.closingMenuClearDelay),
                        ),
                ),
            );
    }

    public get diceResults(): Array<DiceResult> {
        return this._diceService.diceResults;
    }

    public get allCreatureTypes(): Array<CreatureTypes> {
        return Object.values(CreatureTypes);
    }

    public toggleDiceMenu(): void {
        this._store$.dispatch(toggleTopMenu({ menu: MenuNames.DiceMenu }));
    }

    public canSendRollsToFoundryVTT$(): Observable<boolean> {
        return combineLatest([
            SettingsService.settings.foundryVTTSendRolls$,
            SettingsService.settings.foundryVTTUrl$,
        ])
            .pipe(
                map(([sendRolls, url]) => sendRolls && !!url),
            );
    }

    public roll(amount: number, size: number): void {
        this._diceService.roll(amount, size, this.bonus, false);
        this.bonus = 0;
        this._refreshService.processPreparedChanges();
    }

    public signedBonus(bonus: number): string {
        return bonus > 0 ? `+ ${ bonus }` : `- ${ bonus * -1 }`;
    }

    public allAvailableCreatures$(): Observable<Array<Creature>> {
        return this._creatureService.allAvailableCreatures$();
    }

    public onHeal(creature: Creature): void {
        const amount = this.totalDiceSum();
        const dying = this._healthService.dying(creature);

        this._healthService.heal$(creature, amount, true, true, dying)
            .subscribe(() => { this._refreshHealth(creature.type); });
    }

    public onTakeDamage(creature: Creature): void {
        const amount = this.totalDiceSum();
        const wounded = this._healthService.wounded(creature);
        const dying = this._healthService.dying(creature);

        this._healthService
            .takeDamage$(creature, amount, false, wounded, dying)
            .subscribe(() => { this._refreshHealth(creature.type); });
    }

    public setTempHP(creature: Creature): void {
        const amount = this.totalDiceSum();

        creature.health.temporaryHP[0] = { amount, source: 'Manual', sourceId: '' };
        creature.health.temporaryHP.length = 1;
        this._refreshHealth(creature.type);
    }

    public diceResultSum(diceResult: DiceResult): number {
        return diceResult.rolls.reduce((a, b) => a + b, 0) + diceResult.bonus;
    }

    public totalDiceSum(): number {
        return this.diceResults.filter(diceResult => diceResult.included)
            .reduce((a, b) => a + this.diceResultSum(b), 0);
    }

    public sendRollToFoundry(creature: Creature): void {
        this._integrationsService.sendRollToFoundry(creature, '', this.diceResults);
    }

    public unselectAll(): void {
        this._diceService.unselectAll();
    }

    public clear(): void {
        this._diceService.clear();
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['dice', 'all'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (['dice', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _refreshHealth(creatureType: CreatureTypes): void {
        this._refreshService.prepareDetailToChange(creatureType, 'health');
        this._refreshService.prepareDetailToChange(creatureType, 'effects');
        this._refreshService.processPreparedChanges();
    }

}
