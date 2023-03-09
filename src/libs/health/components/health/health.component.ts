import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy, HostBinding } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { TimeService } from 'src/libs/time/services/time/time.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { BehaviorSubject, distinctUntilChanged, map, Subscription, takeUntil } from 'rxjs';
import { Character } from 'src/app/classes/Character';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Creature } from 'src/app/classes/Creature';
import { Health } from 'src/app/classes/Health';
import { CalculatedHealth, HealthService } from 'src/libs/shared/services/health/health.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { TimeBlockingService } from 'src/libs/time/services/time-blocking/time-blocking.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { InputValidationService } from 'src/libs/shared/services/input-validation/input-validation.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { DestroyableMixin } from 'src/libs/shared/util/mixins/destroyable-mixin';

@Component({
    selector: 'app-health',
    templateUrl: './health.component.html',
    styleUrls: ['./health.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthComponent extends DestroyableMixin(TrackByMixin(BaseClass)) implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;

    @Input()
    public showMinimizeButton = true;

    @HostBinding('class.minimized')
    private _combinedMinimized = false;

    public damageSliderMax = 1;

    public damage = 0;
    public nonlethal?: boolean;
    public setTempHP = 0;
    public selectedTempHP?: { amount: number; source: string; sourceId: string };

    public isMinimized$ = new BehaviorSubject<boolean>(false);

    private _isMinimized = false;
    private _forceMinimized = false;

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

        SettingsService.settings$
            .pipe(
                takeUntil(this.destroyed$),
                map(settings => {
                    switch (this.creature) {
                        case CreatureTypes.AnimalCompanion:
                            return settings.companionMinimized;
                        case CreatureTypes.Familiar:
                            return settings.familiarMinimized;
                        default:
                            return settings.healthMinimized;
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

    public get character(): Character {
        return CreatureService.character;
    }

    public get isManualMode(): boolean {
        return SettingsService.isManualMode;
    }

    private get _currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.settings.healthMinimized = minimized;
    }

    public absolute(number: number): number {
        return Math.abs(number);
    }

    public waitingDescription(duration: number): string {
        return this._timeBlockingService.waitingDescription(
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

    public creatureHealth(): Health {
        return this._currentCreature.health;
    }

    public calculatedHealth(): CalculatedHealth {
        const calculatedHealth = this._healthService.calculate(this.creatureHealth(), this._currentCreature);

        //Don't do anything about your dying status in manual mode.
        if (!SettingsService.isManualMode) {
            if (calculatedHealth.dying >= calculatedHealth.maxDying) {
                if (
                    this._creatureConditionsService
                        .currentCreatureConditions(this._currentCreature, { name: 'Doomed' })
                        .length
                ) {
                    this._die('Doomed');
                } else {
                    this._die('Dying value too high');
                }
            }
        }

        this.damageSliderMax = (calculatedHealth.maxHP.result + (this.creatureHealth().temporaryHP[0]?.amount || 0)) || 1;

        return calculatedHealth;
    }

    public incManualDying(amount: number): void {
        this.creatureHealth().manualDying += amount;
    }

    public incManualWounded(amount: number): void {
        this.creatureHealth().manualWounded += amount;
    }

    public onDyingSave(success: boolean, maxDying: number): void {
        if (success) {
            //Reduce all dying conditions by 1
            //Conditions with Value 0 get cleaned up in the conditions Service
            //Wounded is added automatically when Dying is removed
            this._creatureConditionsService
                .currentCreatureConditions(this._currentCreature, { name: 'Dying' })
                .forEach(gain => {
                    gain.value = Math.max(gain.value - 1, 0);
                });
        } else {
            this._creatureConditionsService
                .currentCreatureConditions(this._currentCreature, { name: 'Dying' })
                .forEach(gain => {
                    gain.value = Math.min(gain.value + 1, maxDying);
                });

            if (this._healthService.dying(this._currentCreature) >= maxDying) {
                this._die('Failed Dying Save');
            }
        }

        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public onHeroPointRecover(): void {
        this._creatureConditionsService
            .currentCreatureConditions(this._currentCreature, { name: 'Dying' })
            .forEach(gain => {
                this._creatureConditionsService.removeCondition(this._currentCreature, gain, false, false, false);
            });
        this.character.heroPoints = 0;
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.prepareDetailToChange(this.creature, 'general');
        this._refreshService.processPreparedChanges();
    }

    public onHealWounded(): void {
        this._creatureConditionsService
            .currentCreatureConditions(this._currentCreature, { name: 'Wounded' })
            .forEach(gain => {
                this._creatureConditionsService.removeCondition(this._currentCreature, gain, false);
            });
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public isNumbToDeathAvailable(): boolean {
        if (this._currentCreature.isCharacter()) {
            return !!this._characterFeatsService.characterHasFeat('Numb to Death');
        } else {
            return false;
        }
    }

    public onHealDamage(dying: number): void {
        this._healthService.heal(this.creatureHealth(), this._currentCreature, this.damage, true, true, dying);
        this._refreshService.prepareDetailToChange(this.creature, 'health');
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public onActivateNumbToDeath(dying: number): void {
        this._healthService.heal(this.creatureHealth(), this._currentCreature, this.character.level, true, false, dying);
        this._refreshService.prepareDetailToChange(this.creature, 'health');
        this._refreshService.processPreparedChanges();
    }

    public onTakeDamage(wounded: number, dying: number): void {
        this._healthService.takeDamage(this.creatureHealth(), this._currentCreature, this.damage, this.nonlethal, wounded, dying);
        this._refreshService.prepareDetailToChange(this.creature, 'health');
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public onSetTemporaryHP(amount: number): void {
        this.creatureHealth().temporaryHP[0] = { amount, source: 'Manual', sourceId: '' };
        this.creatureHealth().temporaryHP.length = 1;
        this._refreshService.prepareDetailToChange(this.creature, 'health');
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public onSelectTemporaryHPSet(tempSet?: { amount: number; source: string; sourceId: string }): void {
        if (tempSet) {
            this.creatureHealth().temporaryHP[0] = tempSet;
            this.creatureHealth().temporaryHP.length = 1;
            this._refreshService.prepareDetailToChange(this.creature, 'health');
            this._refreshService.prepareDetailToChange(this.creature, 'effects');
            //Update Health and Time because having multiple temporary HP keeps you from ticking time and resting.
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'health');
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'time');
            this._refreshService.processPreparedChanges();
        }
    }

    public resistances(): Array<{ target: string; value: number; source: string }> {
        //There should be no absolutes in resistances. If there are, they will be treated as relatives here.
        const effects = this._creatureEffectsService.effects(this.creature).all.filter(effect =>
            effect.creature === this._currentCreature.id && (effect.target.toLowerCase().includes('resistance') ||
                effect.target.toLowerCase().includes('hardness')) && effect.apply && !effect.ignored);
        const resistances: Array<{ target: string; value: number; source: string }> = [];

        //Build a list of all resistances other than "Resistances" and add up their respective value.
        effects.filter(effect => effect.target.toLowerCase() !== 'resistances').forEach(effect => {
            const value = parseInt(effect.value, 10) || parseInt(effect.setValue, 10);
            const resistance = resistances.find(res => res.target === effect.target);

            if (resistance) {
                resistance.value += value;
                resistance.source += `\n${ effect.source }: ${ value }`;
            } else {
                resistances.push({ target: effect.target, value, source: `${ effect.source }: ${ value }` });
            }
        });
        //Globally apply any effects on "Resistances".
        effects.filter(effect => effect.target.toLowerCase() === 'resistances').forEach(effect => {
            const value = parseInt(effect.value, 10) || parseInt(effect.setValue, 10);

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
    }

    public immunities(): Array<{ target: string; source: string }> {
        const effects = this._creatureEffectsService.effects(this.creature).all.filter(effect =>
            effect.creature === this._currentCreature.id && (effect.target.toLowerCase().includes('immunity')));
        const immunities: Array<{ target: string; source: string }> = [];

        effects.forEach(effect => {
            if (!immunities.some(immunity => immunity.target === effect.target)) {
                immunities.push({ target: effect.target, source: effect.source });
            }
        });
        immunities.forEach(immunity => {
            immunity.target = immunity.target.split(' ').map(word => word[0].toUpperCase() + word.substring(1).toLowerCase())
                .join(' ');
        });

        return immunities;
    }

    public doAbsoluteEffectsExistOnThis(name: string): boolean {
        return !!this._creatureEffectsService.absoluteEffectsOnThis(this._currentCreature, name).length;
    }

    public doBonusEffectsExistOnThis(name: string): boolean {
        return this._creatureEffectsService.doBonusEffectsExistOnThis(this._currentCreature, name);
    }

    public doPenaltyEffectsExistOnThis(name: string): boolean {
        return this._creatureEffectsService.doPenaltyEffectsExistOnThis(this._currentCreature, name);
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['health', 'all', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === this.creature.toLowerCase() && ['health', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
        this.destroy();
    }

    private _die(reason: string): void {
        if (
            !this._creatureConditionsService
                .currentCreatureConditions(this._currentCreature, { name: 'Dead' })
                .length
        ) {
            this._creatureConditionsService.addCondition(
                this._currentCreature,
                Object.assign(new ConditionGain(), { name: 'Dead', source: reason }),
                {},
                { noReload: true },
            );
            this._creatureConditionsService
                .currentCreatureConditions(this._currentCreature, { name: 'Doomed' }, { readonly: true })
                .forEach(gain => {
                    this._creatureConditionsService.removeCondition(this._currentCreature, gain, false);
                });
        }
    }

}
