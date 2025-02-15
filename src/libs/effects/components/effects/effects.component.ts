import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Observable, distinctUntilChanged, shareReplay, map, combineLatest, switchMap } from 'rxjs';
import { Condition } from 'src/app/classes/conditions/condition';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { Effect } from 'src/app/classes/effects/effect';
import { ConditionPropertiesService } from 'src/libs/shared/services/condition-properties/condition-properties.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { ConditionsDataService } from 'src/libs/shared/services/data/conditions-data.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { BaseCreatureElementComponent } from 'src/libs/shared/util/components/base-creature-element/base-creature-element.component';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { emptySafeCombineLatest, propMap$ } from 'src/libs/shared/util/observable-utils';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { TimeComponent } from 'src/libs/shared/time/components/time/time.component';
import { TagsComponent } from 'src/libs/shared/tags/components/tags/tags.component';
import { NgbTooltip, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { GridIconComponent } from 'src/libs/shared/ui/grid-icon/components/grid-icon/grid-icon.component';
import { StickyPopoverDirective } from 'src/libs/shared/sticky-popover/directives/sticky-popover/sticky-popover.directive';
import { ConditionComponent } from 'src/libs/shared/condition/components/condition/condition.component';
import { CommonModule } from '@angular/common';
import { CharacterSheetCardComponent } from 'src/libs/shared/ui/character-sheet-card/character-sheet-card.component';
import { AppliedCreatureConditionsService } from 'src/libs/shared/services/creature-conditions/applied-creature-conditions.service';
import { ConditionGainPair } from 'src/libs/shared/services/creature-conditions/condition-gain-pair';

interface ComponentParameters {
    effects: Array<Effect>;
    activeConditions: Array<ConditionGainPair>;
    inactiveConditions: Array<ConditionGainPair>;
    isTimeStopped: boolean;
}

interface ConditionParameters {
    isStoppedInTime: boolean;
}

@Component({
    selector: 'app-effects',
    templateUrl: './effects.component.html',
    styleUrls: ['./effects.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        NgbTooltip,
        NgbPopover,

        CharacterSheetCardComponent,
        ConditionComponent,
        StickyPopoverDirective,
        GridIconComponent,
        TagsComponent,
        TimeComponent,
    ],
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
        private readonly _appliedCreatureConditionsService: AppliedCreatureConditionsService,
        private readonly _durationsService: DurationsService,
    ) {
        super();

        this.isManualMode$ = propMap$(SettingsService.settings$$, 'manualMode$')
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
        return combineLatest([
            this._creatureEffectsService.allCreatureEffects$$(this.creature.type),
            this._appliedCreatureConditionsService.appliedCreatureConditions$$(this.creature),
            this._appliedCreatureConditionsService.notAppliedCreatureConditions$$(this.creature),
        ])
            .pipe(
                switchMap(([effects, activeConditions, inactiveConditions]) =>
                    this._isTimeStopped$(activeConditions)
                        .pipe(
                            map(isTimeStopped => ({
                                effects,
                                activeConditions,
                                inactiveConditions,
                                isTimeStopped,
                            })),
                        ),
                ),
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

    //TODO: Add an explanation why these are hidden.
    public hiddenEffects(effects: Array<Effect>): Array<Effect> {
        return effects
            .filter(effect => effect.creature === this.creature.id && effect.applied && !effect.displayed)
            .sort((a, b) => sortAlphaNum(`${ a.target }-${ a.setValue }-${ a.value }`, `${ b.target }-${ b.setValue }-${ b.value }`));
    }

    public conditionParameters(conditionGainPair: ConditionGainPair, isTimeStopped: boolean): ConditionParameters {
        return {
            isStoppedInTime: isTimeStopped && !conditionGainPair.condition.isStoppingTime$$(conditionGainPair.gain),
        };
    }


    public conditionClasses(
        conditionParameters: ConditionParameters,
        condition: Condition,
        // eslint-disable-next-line @typescript-eslint/naming-convention
    ): { penalty: boolean; bonus: boolean; 'inactive-button': boolean } {
        return {
            penalty: !conditionParameters.isStoppedInTime && !condition.buff,
            bonus: !conditionParameters.isStoppedInTime && condition.buff,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'inactive-button': conditionParameters.isStoppedInTime,
        };
    }

    public durationDescription$(duration: number): Observable<string> {
        return this._durationsService.durationDescription$(duration);
    }

    public conditionSuperTitle$(gain: ConditionGain, condition: Condition, paused: boolean): Observable<string> {
        return combineLatest([
            condition.isStoppingTime$$(gain),
            this._conditionPropertiesService.isConditionInformational$$(condition, { creature: this.creature, gain }),
        ])
            .pipe(
                map(([isStoppingTime, isInformational]) => {
                    if (isStoppingTime) {
                        return 'icon-ra ra-hourglass';
                    }

                    if (paused) {
                        return 'icon-bi-pause-circle';
                    }

                    if (isInformational) {
                        return 'icon-bi-info-circle';
                    }

                    return '';
                }),
            );
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

    private _isTimeStopped$(conditions: Array<ConditionGainPair>): Observable<boolean> {
        return emptySafeCombineLatest(
            conditions
                .map(({ gain, condition }) => condition.isStoppingTime$$(gain)),
        )
            .pipe(
                map(isStoppingTimeList => isStoppingTimeList.includes(true)),
            );
    }

}
