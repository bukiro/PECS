import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { TimeService } from 'src/libs/shared/time/services/time/time.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import {
    BehaviorSubject,
    combineLatest,
    distinctUntilChanged,
    map,
    Observable,
    of,
    Subscription,
    switchMap,
} from 'rxjs';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Creature } from 'src/app/classes/Creature';
import { CalculatedHealth, HealthService } from 'src/libs/shared/services/health/health.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { TimeBlockingService } from 'src/libs/shared/time/services/time-blocking/time-blocking.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { InputValidationService } from 'src/libs/shared/services/input-validation/input-validation.service';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { propMap$ } from 'src/libs/shared/util/observableUtils';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { stringEqualsCaseInsensitive, stringsIncludeCaseInsensitive } from 'src/libs/shared/util/stringUtils';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { BaseCreatureElementComponent } from 'src/libs/shared/util/components/base-creature-element/base-creature-element.component';

@Component({
    selector: 'app-health',
    templateUrl: './health.component.html',
    styleUrls: ['./health.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthComponent extends TrackByMixin(BaseCreatureElementComponent) implements OnInit, OnDestroy {

    public damage = 0;
    public nonlethal?: boolean;
    public setTempHP = 0;
    public selectedTempHP?: { amount: number; source: string; sourceId: string };

    public readonly isManualMode$: Observable<boolean>;
    public isMinimized$: Observable<boolean>;

    private _forceMinimized = false;

    private readonly _isForcedMinimized$ = new BehaviorSubject<boolean>(false);
    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _timeService: TimeService,
        private readonly _refreshService: RefreshService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _healthService: HealthService,
        private readonly _timeBlockingService: TimeBlockingService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) {
        super();

        this.isMinimized$ =
            combineLatest([
                this.creature$
                    .pipe(
                        switchMap(creature => SettingsService.settings$
                            .pipe(
                                switchMap(settings => {
                                    switch (creature.type) {
                                        case CreatureTypes.AnimalCompanion:
                                            return settings.companionMinimized$;
                                        case CreatureTypes.Familiar:
                                            return settings.familiarMinimized$;
                                        default:
                                            return settings.healthMinimized$;
                                    }
                                }),
                            ),
                        ),
                    ),
                this._isForcedMinimized$,
            ])
                .pipe(
                    map(([forced, bySetting]) => forced || bySetting),
                    distinctUntilChanged(),
                );

        this.isManualMode$ = propMap$(SettingsService.settings$, 'manualMode$');
    }

    public get creature(): Creature {
        return super.creature;
    }

    @Input()
    public set creature(creature: Creature) {
        this._updateCreature(creature);
    }

    @Input()
    public set forceMinimized(forceMinimized: boolean | undefined) {
        this._forceMinimized = !!forceMinimized;
        this._isForcedMinimized$.next(this._forceMinimized);
    }

    public get shouldShowMinimizeButton(): boolean {
        return !this._forceMinimized && this.creature.isCharacter();
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.settings.healthMinimized = minimized;
    }

    public absolute(number: number): number {
        return Math.abs(number);
    }

    public waitingDescription$(duration: number): Observable<string | undefined> {
        return this._timeBlockingService.waitingDescription$(
            duration,
            { includeResting: true },
        );
    }

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    public onRest(): void {
        this._timeService.rest();
    }

    public calculatedHealth(): CalculatedHealth {
        const calculatedHealth = this._healthService.calculate(this.creature);

        return calculatedHealth;
    }

    public damageSliderMax(maxHP: number): number {
        return (maxHP + (this.creature.health.temporaryHP[0]?.amount || 0)) || 1;
    }

    public incManualDying(amount: number): void {
        this.creature.health.manualDying += amount;
    }

    public incManualWounded(amount: number): void {
        this.creature.health.manualWounded += amount;
    }

    public onDyingSave(success: boolean, maxDying: number): void {
        if (success) {
            //Reduce all dying conditions by 1
            //Conditions with Value 0 get cleaned up in the conditions Service
            //Wounded is added automatically when Dying is removed
            this._creatureConditionsService
                .currentCreatureConditions(this.creature, { name: 'Dying' })
                .forEach(gain => {
                    gain.value = Math.max(gain.value - 1, 0);
                });
        } else {
            this._creatureConditionsService
                .currentCreatureConditions(this.creature, { name: 'Dying' })
                .forEach(gain => {
                    gain.value = Math.min(gain.value + 1, maxDying);
                });

            if (this._healthService.dying(this.creature) >= maxDying) {
                this._die('Failed Dying Save');
            }
        }

        this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public onHeroPointRecover(): void {
        this._creatureConditionsService
            .currentCreatureConditions(this.creature, { name: 'Dying' })
            .forEach(gain => {
                this._creatureConditionsService.removeCondition(this.creature, gain, false, false, false);
            });
        CreatureService.character.heroPoints = 0;
        this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
        this._refreshService.prepareDetailToChange(this.creature.type, 'general');
        this._refreshService.processPreparedChanges();
    }

    public onHealWounded(): void {
        this._creatureConditionsService
            .currentCreatureConditions(this.creature, { name: 'Wounded' })
            .forEach(gain => {
                this._creatureConditionsService.removeCondition(this.creature, gain, false);
            });
        this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public isNumbToDeathAvailable$(): Observable<boolean> {
        if (this.creature.isCharacter()) {
            return this._characterFeatsService.characterHasFeatAtLevel$('Numb to Death');
        } else {
            return of(false);
        }
    }

    public onHealDamage(dying: number): void {
        this._healthService.heal$(this.creature, this.damage, true, true, dying);
        this._refreshService.prepareDetailToChange(this.creature.type, 'health');
        this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public onActivateNumbToDeath(dying: number): void {
        this._healthService.heal$(this.creature, CreatureService.character.level, true, false, dying);
        this._refreshService.prepareDetailToChange(this.creature.type, 'health');
        this._refreshService.processPreparedChanges();
    }

    public onTakeDamage(wounded: number, dying: number): void {
        this._healthService
            .takeDamage$(this.creature, this.damage, this.nonlethal, wounded, dying)
            .subscribe(() => {
                this._refreshService.prepareDetailToChange(this.creature.type, 'health');
                this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
                this._refreshService.processPreparedChanges();
            });

    }

    public onSetTemporaryHP(amount: number): void {
        this.creature.health.temporaryHP[0] = { amount, source: 'Manual', sourceId: '' };
        this.creature.health.temporaryHP.length = 1;
        this._refreshService.prepareDetailToChange(this.creature.type, 'health');
        this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public onSelectTemporaryHPSet(tempSet?: { amount: number; source: string; sourceId: string }): void {
        if (tempSet) {
            this.creature.health.temporaryHP[0] = tempSet;
            this.creature.health.temporaryHP.length = 1;
            this._refreshService.prepareDetailToChange(this.creature.type, 'health');
            this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
            //Update Health and Time because having multiple temporary HP keeps you from ticking time and resting.
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'health');
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'time');
            this._refreshService.processPreparedChanges();
        }
    }

    public resistances$(): Observable<Array<{ target: string; value: number; source: string }>> {
        return combineLatest([
            this._creatureEffectsService.effectsOnThis$(this.creature, 'resistance', { allowPartialString: true }),
            this._creatureEffectsService.effectsOnThis$(this.creature, 'hardness', { allowPartialString: true }),
        ])
            .pipe(
                map(([resistanceEffects, hardnessEffects]) => {
                    //There should be no absolutes in resistances. If there are, they will be treated as relatives here.
                    const resistances: Array<{ target: string; value: number; source: string }> = [];

                    //Build a list of all resistances other than "Resistances" and add up their respective value.
                    resistanceEffects
                        .concat(hardnessEffects)
                        .filter(effect => !stringEqualsCaseInsensitive(effect.target, 'resistances'))
                        .forEach(effect => {
                            const value = effect.valueNumerical || effect.setValueNumerical || 0;
                            const resistance = resistances.find(res => res.target === effect.target);

                            if (resistance) {
                                resistance.value += value;
                                resistance.source += `\n${ effect.source }: ${ value }`;
                            } else {
                                resistances.push({ target: effect.target, value, source: `${ effect.source }: ${ value }` });
                            }
                        });
                    //Globally apply any effects on "Resistances".
                    resistanceEffects
                        .filter(effect => effect.target.toLowerCase() === 'resistances')
                        .forEach(effect => {
                            const value = effect.valueNumerical || effect.setValueNumerical || 0;

                            resistances.forEach(resistance => {
                                resistance.value += value;
                                resistance.source += `\n${ effect.source }: ${ value }`;
                            });
                        });

                    resistances.forEach((res: { target: string; value: number; source: string }) => {
                        if (res.value < 0) {
                            res.target = res.target.toLowerCase().replace('resistance', 'weakness');
                        }

                        res.target = res.target.split(' ').map(word => word[0].toUpperCase() + word.substr(1).toLowerCase())
                            .join(' ');
                    });

                    return resistances;
                }),
            );
    }

    public immunities$(): Observable<Array<{ target: string; source: string }>> {
        return this._creatureEffectsService.effectsOnThis$(this.creature, 'immunity', { allowPartialString: true })
            .pipe(
                map(immunityEffects => {
                    const immunities: Array<{ target: string; source: string }> = [];

                    immunityEffects.forEach(effect => {
                        if (!immunities.some(immunity => immunity.target === effect.target)) {
                            immunities.push({ target: effect.target, source: effect.source });
                        }
                    });

                    immunities.forEach(immunity => {
                        immunity.target = immunity.target.split(' ').map(word => word[0].toUpperCase() + word.substring(1).toLowerCase())
                            .join(' ');
                    });

                    return immunities;
                }),
            );
    }

    //TO-DO: This should come as part of the respective value instead of separately.
    public doAbsoluteEffectsExistOnThis$(name: string): Observable<boolean> {
        return this._creatureEffectsService.absoluteEffectsOnThis$(this.creature, name)
            .pipe(
                map(absolutes => !!absolutes.length),
            );
    }

    //TO-DO: This should come as part of the respective value instead of separately.
    public doBonusEffectsExistOnThis$(name: string): Observable<boolean> {
        return this._creatureEffectsService.doBonusEffectsExistOnThis$(this.creature, name);
    }

    //TO-DO: This should come as part of the respective value instead of separately.
    public doPenaltyEffectsExistOnThis$(name: string): Observable<boolean> {
        return this._creatureEffectsService.doPenaltyEffectsExistOnThis$(this.creature, name);
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (stringsIncludeCaseInsensitive(['health', 'all', this.creature.type], target)) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    stringEqualsCaseInsensitive(view.creature, this.creature.type)
                    && stringsIncludeCaseInsensitive(['health', 'all'], view.target)
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _die(reason: string): void {
        if (
            !this._creatureConditionsService
                .currentCreatureConditions(this.creature, { name: 'Dead' })
                .length
        ) {
            this._creatureConditionsService.addCondition(
                this.creature,
                ConditionGain.from({ name: 'Dead', source: reason }, RecastService.recastFns),
                {},
                { noReload: true },
            );
            this._creatureConditionsService
                .currentCreatureConditions(this.creature, { name: 'Doomed' }, { readonly: true })
                .forEach(gain => {
                    this._creatureConditionsService.removeCondition(this.creature, gain, false);
                });
        }
    }

}
