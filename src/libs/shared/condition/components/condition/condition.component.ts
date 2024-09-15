import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, Input, Output, ChangeDetectorRef, EventEmitter } from '@angular/core';
import { BehaviorSubject, Subscription, Observable, of, combineLatest, map } from 'rxjs';
import { Activity } from 'src/app/classes/activities/activity';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { ItemActivity } from 'src/app/classes/activities/item-activity';
import { Condition, OtherConditionSelection } from 'src/app/classes/conditions/condition';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { ConditionGainPropertiesService } from 'src/libs/shared/services/condition-gain-properties/condition-gain-properties.service';
import { ConditionPropertiesService } from 'src/libs/shared/services/condition-properties/condition-properties.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ConditionsDataService } from 'src/libs/shared/services/data/conditions-data.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { emptySafeCombineLatest } from 'src/libs/shared/util/observable-utils';
import { stringsIncludeCaseInsensitive, stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';
import { GridIconComponent } from 'src/libs/shared/ui/grid-icon/components/grid-icon/grid-icon.component';
import { StickyPopoverDirective } from '../../../sticky-popover/directives/sticky-popover/sticky-popover.directive';
import { ActivityComponent } from '../../../activity/components/activity/activity.component';
import { ActionIconsComponent } from 'src/libs/shared/ui/action-icons/components/action-icons/action-icons.component';
import { ConditionContentComponent } from '../../../condition-content/components/condition-content/condition-content.component';
import { QuickdiceComponent } from '../../../quickdice/components/quickdice/quickdice.component';
import { NgbTooltip, NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CreatureConditionRemovalService } from 'src/libs/shared/services/creature-conditions/creature-condition-removal.service';
import { matchStringListFilter } from 'src/libs/shared/util/filter-utils';

interface ActivityParameters {
    gain: ActivityGain | ItemActivity;
    activity: Activity | ItemActivity;
    maxCharges: number;
    cooldown: number;
    canNotActivate: boolean;
    isHostile: boolean;
}

@Component({
    selector: 'app-condition',
    templateUrl: './condition.component.html',
    styleUrls: ['./condition.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltip,
        NgbCollapse,

        QuickdiceComponent,
        ConditionContentComponent,
        ActionIconsComponent,
        ActivityComponent,
        StickyPopoverDirective,
        GridIconComponent,
    ],
})
export class ConditionComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public conditionGain?: ConditionGain;
    @Input()
    public paused?: boolean;
    @Input()
    public condition!: Condition;
    @Input()
    public showItem = '';
    @Input()
    public fullDisplay = false;
    @Output()
    public readonly showItemMessage = new EventEmitter<string>();

    public creature$: BehaviorSubject<Creature>;

    private _creature: Creature = CreatureService.character;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _conditionGainPropertiesService: ConditionGainPropertiesService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _conditionPropertiesService: ConditionPropertiesService,
        private readonly _creatureConditionRemovalService: CreatureConditionRemovalService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
        private readonly _durationsService: DurationsService,
    ) {
        super();

        this.creature$ = new BehaviorSubject<Creature>(CreatureService.character);
    }

    public get creature(): Creature {
        return this._creature;
    }

    @Input()
    public set creature(creature: Creature) {
        this._creature = creature;
        this.creature$.next(this._creature);
    }

    public durationDescription$(duration: number): Observable<string> {
        return this._durationsService.durationDescription$(duration);
    }

    public isInformationalCondition$(): Observable<boolean> {
        return this._conditionPropertiesService.isConditionInformational$(
            this.condition,
            { creature: this.creature, gain: this.conditionGain },
        );
    }

    public setConditionDuration(gain: ConditionGain, turns: number): void {
        gain.duration = turns;
        gain.maxDuration = gain.duration;
        this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
        this._refreshService.processPreparedChanges();
        this._updateCondition();
    }

    public incConditionDuration(gain: ConditionGain, turns: number): void {
        gain.duration += turns;
        gain.maxDuration = gain.duration;
        this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
        this._refreshService.processPreparedChanges();
        this._updateCondition();
    }

    public setConditionValue(gain: ConditionGain, event: Event): void {
        const set = parseInt((event.target as HTMLSelectElement).value, 10);

        if (!isNaN(set)) {
            this.incConditionValue(gain, set - gain.value);
        }
    }

    public incConditionValue(gain: ConditionGain, change: number): void {
        gain.value += change;

        if (gain.name === 'Drained' && change < 0) {
            //When you lower your drained value, you regain Max HP, but not the lost HP.
            //Because HP is Max HP - Damage, we increase damage to represent not regaining the HP.
            //We subtract level*change from damage because change is negative.
            this.creature.health.damage =
                Math.max(0, (this.creature.health.damage - (this.creature.level * change)));
        }

        gain.showValue = false;
        this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
        this._refreshService.processPreparedChanges();
        this._updateCondition();
    }

    public incConditionRadius(gain: ConditionGain, change: number): void {
        gain.radius += change;
    }

    public conditionChoices$(gain: ConditionGain, condition: Condition): Observable<Array<string>> {
        if (gain.source !== 'Manual') {
            return this._conditionPropertiesService.effectiveChoices$(condition, gain.heightened);
        }

        return of(condition.unfilteredChoices());
    }

    public changeConditionChoice(gain: ConditionGain, condition: Condition, event: Event): void {
        const newChoice = (event.target as HTMLSelectElement).value;
        const oldChoice = gain.choice;

        gain.choice = newChoice;
        this._conditionGainPropertiesService.changeConditionChoice(
            this.creature,
            gain,
            condition,
            oldChoice,
        );
        this._refreshService.processPreparedChanges();
        this._updateCondition();
    }

    public prepareSelectingOtherConditions(gain: ConditionGain, condition: Condition): Array<OtherConditionSelection> {
        condition.selectOtherConditions.forEach((_selection, index) => {
            //Ensure that the condition gain has a place for each selection in its array.
            if (gain.selectedOtherConditions.length <= index) {
                gain.selectedOtherConditions.push('');
            }
        });

        return condition.selectOtherConditions;
    }

    public selectOtherConditionOptions$(selection: OtherConditionSelection, gain: ConditionGain, index: number): Observable<Array<string>> {
        const creature = this.creature;
        const allowedConditions = this._conditionsDataService.conditions().filter(libraryCondition =>
            matchStringListFilter({ match: selection.typeFilter, value: libraryCondition.type })
            && matchStringListFilter({ match: selection.nameFilter, value: libraryCondition.name }),
        )
            .map(libraryCondition => libraryCondition.name);

        return creature.conditions.values$
            .pipe(
                map(conditions =>
                    conditions
                        .map(conditionGain => conditionGain.name)
                        .filter(conditionName =>
                            !stringEqualsCaseInsensitive(conditionName, gain.name)
                            && matchStringListFilter({ match: allowedConditions, value: conditionName }),
                        )
                        .concat('', gain.selectedOtherConditions[index] ?? ''),
                ),
                map(conditionNames => Array.from(new Set(conditionNames)).sort()),
            );
    }

    public setConditionStage(gain: ConditionGain, condition: Condition, choices: Array<string>, change: number): void {
        this._conditionGainPropertiesService.changeConditionStage(
            this.creature,
            gain,
            condition,
            choices,
            change,
        );
        this._refreshService.processPreparedChanges();
        this._updateCondition();
    }

    public changeOtherConditionSelection(): void {
        this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
        this._refreshService.processPreparedChanges();
        this._updateCondition();
    }

    public removeCondition(conditionGain: ConditionGain): void {
        this._creatureConditionRemovalService.removeSingleConditionGain(conditionGain, this.creature);
        this._refreshService.setComponentChanged('close-popovers');
    }

    public conditionActivitiesParameters$(): Observable<Array<ActivityParameters>> {
        if (this.conditionGain) {
            const heightened = this.conditionGain.heightened;

            return emptySafeCombineLatest(
                this.conditionGain.gainActivities
                    .map(gain =>
                        combineLatest([
                            this._activityPropertiesService.effectiveCooldown$(
                                gain.originalActivity,
                                { creature: this.creature },
                            ),
                            this._activityPropertiesService.effectiveMaxCharges$(
                                gain.originalActivity,
                                { creature: this.creature },
                            ),
                        ])
                            .pipe(
                                map(([cooldown, maxCharges]) => ({ gain, cooldown, maxCharges })),
                            ),
                    ),
            )
                .pipe(
                    map(activitySets =>
                        activitySets.map(({ gain, cooldown, maxCharges }) => {
                            const activity = gain.originalActivity;

                            gain.heightened = heightened;

                            const canNotActivate = ((gain.activeCooldown ? (maxCharges === gain.chargesUsed) : false) && !gain.active);
                            const isHostile = activity.isHostile();

                            return {
                                gain,
                                activity,
                                maxCharges,
                                cooldown,
                                canNotActivate,
                                isHostile,
                            };
                        }),
                    ),
                );
        } else {
            return of([]);
        }
    }

    /* eslint-disable @typescript-eslint/naming-convention */
    public activityClasses(
        activityParameters: ActivityParameters,
    ): { 'fancy-button': boolean; 'inactive-button': boolean; penalty: boolean; bonus: boolean } {
        return {
            'fancy-button': activityParameters.gain.active,
            'inactive-button': activityParameters.canNotActivate,
            penalty: !activityParameters.canNotActivate && activityParameters.isHostile,
            bonus: !activityParameters.canNotActivate && !activityParameters.isHostile,
        };
        /* eslint-enable @typescript-eslint/naming-convention */
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (stringsIncludeCaseInsensitive(['effects', 'all', this.creature.type], target)) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    stringEqualsCaseInsensitive(view.creature, this.creature.type)
                    && stringsIncludeCaseInsensitive(['effects', 'all'], view.target)
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _updateCondition(): void {
        //This updates any gridicon that has this condition gain's id set as its update id.
        if (this.conditionGain?.id) {
            this._refreshService.setComponentChanged(this.conditionGain.id);
        }
    }

}
