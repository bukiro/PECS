import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, switchMap, map, distinctUntilChanged, of } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { HealthService } from 'src/libs/shared/services/health/health.service';
import { InputValidationService } from 'src/libs/shared/services/input-validation/input-validation.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { TimeBlockingService } from 'src/libs/shared/time/services/time-blocking/time-blocking.service';
import { TimeService } from 'src/libs/shared/time/services/time/time.service';
import { BaseCreatureElementComponent } from 'src/libs/shared/util/components/base-creature-element/base-creature-element.component';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { propMap$ } from 'src/libs/shared/util/observable-utils';
import { capitalize, stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';
import { FormsModule } from '@angular/forms';
import { TagsComponent } from 'src/libs/shared/tags/components/tags/tags.component';
import { NgbPopover, NgbProgressbar, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { CharacterSheetCardComponent } from 'src/libs/shared/ui/character-sheet-card/character-sheet-card.component';
import { CreatureConditionRemovalService } from 'src/libs/shared/services/creature-conditions/creature-condition-removal.service';
import { filterConditions } from 'src/libs/shared/services/creature-conditions/condition-filter-utils';
import { TemporaryHP } from 'src/app/classes/creatures/temporary-hp';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { PrettyValueComponent } from 'src/libs/shared/ui/attribute-value/components/pretty-value/pretty-value.component';

interface CollectedHealth {
    maxHP: { result: number; bonuses: Array<BonusDescription> };
    currentHP: { result: number; bonuses: Array<BonusDescription> };
    wounded: number;
    dying: number;
    maxDying: { result: number; bonuses: Array<BonusDescription> };
}

@Component({
    selector: 'app-health',
    templateUrl: './health.component.html',
    styleUrls: ['./health.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NgbPopover,
        NgbProgressbar,
        NgbTooltip,
        CharacterSheetCardComponent,
        TagsComponent,
        PrettyValueComponent,
    ],
})
export class HealthComponent extends TrackByMixin(BaseCreatureElementComponent) {

    public damage = 0;
    public nonlethal?: boolean;
    public setTempHP = 0;
    public selectedTempHP?: { amount: number; source: string; sourceId: string };

    public readonly isManualMode$: Observable<boolean>;
    public isMinimized$: Observable<boolean>;

    public calculatedHealth$: Observable<CollectedHealth>;

    private _forceMinimized = false;

    private readonly _isForcedMinimized$ = new BehaviorSubject<boolean>(false);

    constructor(
        private readonly _timeService: TimeService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _creatureConditionRemovalService: CreatureConditionRemovalService,
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
                    map(([bySetting, forced]) => forced || bySetting),
                    distinctUntilChanged(),
                );

        this.isManualMode$ = propMap$(SettingsService.settings$, 'manualMode$');

        this.calculatedHealth$ = this.creature$
            .pipe(
                switchMap(creature =>
                    combineLatest({
                        maxHP: this._healthService.maxHP$(creature),
                        currentHP: this._healthService.currentHP$(creature),
                        wounded: this._healthService.wounded$(creature),
                        dying: this._healthService.dying$(creature),
                        maxDying: this._healthService.maxDying$(creature),
                    }),
                ),
            );

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

    public damageSliderMax(maxHP: number): number {
        return (maxHP + this.creature.health.mainTemporaryHP.amount) || 1;
    }

    public incManualDying(amount: number): void {
        this.creature.health.manualDying += amount;
    }

    public incManualWounded(amount: number): void {
        this.creature.health.manualWounded += amount;
    }

    public onDyingSave(success: boolean): void {
        if (success) {
            //Reduce all dying conditions by 1
            //Conditions with Value 0 get cleaned up in the conditions Service
            //Wounded is added automatically when Dying is removed
            filterConditions(this.creature.conditions, { name: 'Dying' })
                .forEach(gain => {
                    gain.value = Math.max(gain.value - 1, 0);
                });
        } else {
            filterConditions(this.creature.conditions, { name: 'Dying' })
                .forEach(gain => {
                    gain.value = Math.min(gain.value + 1);
                });
        }
    }

    public onHeroPointRecover(): void {
        this._creatureConditionRemovalService.removeConditionGains(
            filterConditions(this.creature.conditions, { name: 'Dying' }),
            this.creature,
            { preventWoundedIncrease: true, allowRemovePersistentConditions: true },
        );

        CreatureService.character.heroPoints = 0;
    }

    public onHealWounded(): void {
        this._creatureConditionRemovalService.removeConditionGains(
            filterConditions(this.creature.conditions, { name: 'Wounded' }),
            this.creature,
        );
    }

    public isNumbToDeathAvailable$(): Observable<boolean> {
        if (this.creature.isCharacter()) {
            return this._characterFeatsService.characterHasFeatAtLevel$('Numb to Death');
        } else {
            return of(false);
        }
    }

    public onHealDamage(): void {
        this._healthService.heal(this.creature, this.damage, true, true);
    }

    public onActivateNumbToDeath(): void {
        this._healthService.heal(this.creature, CreatureService.character.level, true, false);
    }

    public onTakeDamage(): void {
        this._healthService.takeDamage$(this.creature, this.damage, { nonlethal: this.nonlethal });
    }

    public onSetTemporaryHP(amount: number): void {
        this.creature.health.temporaryHP = [TemporaryHP.from({ amount, source: 'Manual', sourceId: '' })];
    }

    public onSelectTemporaryHPSet(tempSet?: { amount: number; source: string; sourceId: string }): void {
        if (tempSet) {
            this.creature.health.temporaryHP = [TemporaryHP.from(tempSet)];
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

                        res.target = res.target.split(' ').map(capitalize)
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
                        immunity.target = immunity.target.split(' ').map(capitalize)
                            .join(' ');
                    });

                    return immunities;
                }),
            );
    }

    //TODO: This should come as part of the respective value instead of separately.
    public doAbsoluteEffectsExistOnThis$(name: string): Observable<boolean> {
        return this._creatureEffectsService.absoluteEffectsOnThis$(this.creature, name)
            .pipe(
                map(absolutes => !!absolutes.length),
            );
    }

    //TODO: This should come as part of the respective value instead of separately.
    public doBonusEffectsExistOnThis$(name: string): Observable<boolean> {
        return this._creatureEffectsService.doBonusEffectsExistOnThis$(this.creature, name);
    }

    //TODO: This should come as part of the respective value instead of separately.
    public doPenaltyEffectsExistOnThis$(name: string): Observable<boolean> {
        return this._creatureEffectsService.doPenaltyEffectsExistOnThis$(this.creature, name);
    }
}
