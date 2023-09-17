import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Effect } from 'src/app/classes/Effect';
import { Condition } from 'src/app/classes/Condition';
import { Observable, distinctUntilChanged, map, shareReplay } from 'rxjs';
import { sortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { ConditionsDataService } from 'src/libs/shared/services/data/conditions-data.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { ConditionPropertiesService } from 'src/libs/shared/services/condition-properties/condition-properties.service';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { BaseCreatureElementComponent } from 'src/libs/shared/util/components/creature-component/base-creature-element.component';
import { propMap$ } from 'src/libs/shared/util/observableUtils';
import { Creature } from 'src/app/classes/Creature';

interface ComponentParameters {
    effects: Array<Effect>;
    conditions: Array<ConditionGain>;
    isTimeStopped: boolean;
}

interface ConditionParameters {
    condition: Condition;
    isStoppedInTime: boolean;
}

@Component({
    selector: 'app-effects',
    templateUrl: './effects.component.html',
    styleUrls: ['./effects.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectsComponent extends TrackByMixin(BaseCreatureElementComponent) {

    @Input()
    public fullDisplay = false;

    public showApplied = true;
    public showNotApplied = false;
    public showHidden = false;
    public showItem = '';

    public isManualMode$: Observable<boolean>;

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _conditionPropertiesService: ConditionPropertiesService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _durationsService: DurationsService,
    ) {
        super();

        this.isManualMode$ = propMap$(SettingsService.settings$, 'manualMode$')
            .pipe(
                distinctUntilChanged(),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );
    }

    public get creature(): Creature {
        return super.creature;
    }

    @Input()
    public set creature(creature: Creature) {
        this._updateCreature(creature);
    }

    public toggleShownItem(name: string): void {
        this.showItem = this.showItem === name ? '' : name;
    }

    public shownItem(): string {
        return this.showItem;
    }

    public receiveShownItemMessage(name: string): void {
        this.toggleShownItem(name);
    }

    public toggleShowApplied(): void {
        this.showApplied = !this.showApplied;
    }

    public toggleShowNotApplied(): void {
        this.showNotApplied = !this.showNotApplied;
    }

    public toggleShowHidden(): void {
        this.showHidden = !this.showHidden;
    }

    public countToggledViews(): number {
        return (this.showApplied ? 1 : 0) + (this.showNotApplied ? 1 : 0) + (this.showHidden ? 1 : 0);
    }

    public componentParameters$(): Observable<ComponentParameters> {
        const conditions = this._creatureConditionsService.currentCreatureConditions(this.creature);
        const isTimeStopped = this._isTimeStopped(conditions);

        return this._creatureEffectsService.allCreatureEffects$(this.creature.type)
            .pipe(
                map(effects => ({
                    effects,
                    conditions,
                    isTimeStopped,
                })),
            );
    }

    public conditionFromName(name: string): Condition {
        return this._conditionsDataService.conditionFromName(name);
    }

    public appliedEffects(effects: Array<Effect>): Array<Effect> {
        return effects
            .filter(effect => effect.creature === this.creature.id && effect.applied && effect.displayed)
            .sort((a, b) => sortAlphaNum(`${ a.target }-${ a.setValue }-${ a.value }`, `${ b.target }-${ b.setValue }-${ b.value }`));
    }

    public notAppliedEffects(effects: Array<Effect>): Array<Effect> {
        return effects
            .filter(effect => effect.creature === this.creature.id && !effect.applied)
            .sort((a, b) => sortAlphaNum(`${ a.target }-${ a.setValue }-${ a.value }`, `${ b.target }-${ b.setValue }-${ b.value }`));
    }

    //TO-DO: Add an explanation why these are hidden.
    public hiddenEffects(effects: Array<Effect>): Array<Effect> {
        return effects
            .filter(effect => effect.creature === this.creature.id && effect.applied && !effect.displayed)
            .sort((a, b) => sortAlphaNum(`${ a.target }-${ a.setValue }-${ a.value }`, `${ b.target }-${ b.setValue }-${ b.value }`));
    }

    public appliedConditions(
        conditions: Array<ConditionGain>,
        apply: boolean,
        forceAllowInstantConditions: boolean = false,
    ): Array<ConditionGain> {
        return conditions
            .filter(gain =>
                gain.apply === apply ||
                (forceAllowInstantConditions && gain.durationIsInstant) ||
                (forceAllowInstantConditions && gain.nextStage === -1),
            );
    }

    public conditionParameters(conditionGain: ConditionGain, isTimeStopped: boolean): ConditionParameters {
        const condition = this.conditionFromName(conditionGain.name);

        return {
            condition,
            isStoppedInTime: isTimeStopped && !condition.isStoppingTime(conditionGain),
        };
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public conditionClasses(conditionParameters: ConditionParameters): { penalty: boolean; bonus: boolean; 'inactive-button': boolean } {
        return {
            penalty: !conditionParameters.isStoppedInTime && !conditionParameters.condition.buff,
            bonus: !conditionParameters.isStoppedInTime && conditionParameters.condition.buff,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'inactive-button': conditionParameters.isStoppedInTime,
        };
    }

    public durationDescription$(duration: number): Observable<string> {
        return this._durationsService.durationDescription$(duration);
    }

    public conditionSuperTitle(conditionGain: ConditionGain, condition: Condition): string {
        if (condition.isStoppingTime(conditionGain)) {
            return 'icon-ra ra-hourglass';
        }

        if (conditionGain.paused) {
            return 'icon-bi-pause-circle';
        }

        if (this._conditionPropertiesService.isConditionInformational(this.creature, condition, conditionGain)) {
            return 'icon-bi-info-circle';
        }

        return '';
    }

    public onIgnoreEffect(effect: Effect, ignore: boolean): void {
        if (ignore) {
            this.creature.ignoredEffects.push(effect);
        } else {
            this.creature.ignoredEffects = this.creature.ignoredEffects.filter(ignoredEffect =>
                !(
                    ignoredEffect.creature === effect.creature &&
                    ignoredEffect.target === effect.target &&
                    ignoredEffect.source === effect.source
                ),
            );
        }
    }

    private _isTimeStopped(conditions: Array<ConditionGain>): boolean {
        return this.appliedConditions(conditions, true, true)
            .some(gain => this._conditionsDataService.conditionFromName(gain.name).isStoppingTime(gain));
    }

}
