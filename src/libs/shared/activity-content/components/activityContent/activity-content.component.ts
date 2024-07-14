import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, Input, ChangeDetectorRef } from '@angular/core';
import { Subscription, Observable, map, of } from 'rxjs';
import { Activity } from 'src/app/classes/activities/activity';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { ItemActivity } from 'src/app/classes/activities/item-activity';
import { Condition } from 'src/app/classes/conditions/condition';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { Trait } from 'src/app/classes/hints/trait';
import { Spell } from 'src/app/classes/spells/spell';
import { SpellCast } from 'src/app/classes/spells/spell-cast';
import { ConditionPropertiesService } from 'src/libs/shared/services/condition-properties/condition-properties.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ActivitiesDataService } from 'src/libs/shared/services/data/activities-data.service';
import { ConditionsDataService } from 'src/libs/shared/services/data/conditions-data.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { SpellPropertiesService } from 'src/libs/shared/services/spell-properties/spell-properties.service';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { stringsIncludeCaseInsensitive, stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';

@Component({
    selector: 'app-activity-content',
    templateUrl: './activity-content.component.html',
    styleUrls: ['./activity-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityContentComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public creature: Creature = CreatureService.character;
    @Input()
    public activity!: Activity | ItemActivity;
    @Input()
    public gain?: ActivityGain | ItemActivity;
    @Input()
    public allowActivate?: boolean;
    @Input()
    public cooldown = 0;
    @Input()
    public maxCharges = 0;

    public readonly isManualMode$ = SettingsService.settings.manualMode$;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _conditionPropertiesService: ConditionPropertiesService,
        private readonly _durationsService: DurationsService,
        private readonly _spellPropertiesService: SpellPropertiesService,
    ) {
        super();
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsDataService.traitFromName(traitName);
    }

    public spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

    public durationDescription$(duration: number, includeTurnState = true, inASentence = false): Observable<string> {
        return this._durationsService.durationDescription$(duration, includeTurnState, inASentence);
    }

    public activities(name: string): Array<Activity> {
        return this._activitiesDataService.activities(name);
    }

    public spellCasts(): Array<SpellCast> {
        if (this.gain) {
            while (this.gain.spellEffectChoices.length < this.activity.castSpells.length) {
                this.gain.spellEffectChoices.push([]);
            }
        }

        return this.activity.castSpells;
    }

    //TODO: Verify that this mutates the spellEffectChoices properly (and generally works).
    public spellConditions$(
        spellCast: SpellCast,
        spellCastIndex: number,
    ): Observable<Array<{ conditionGain: ConditionGain; condition: Condition; choices: Array<string>; show: boolean }>> {
        const gain = this.gain;

        if (gain) {
            const spell = this._spellsDataService.spellFromName(spellCast.name);

            if (spell) {
                return this._spellPropertiesService.spellConditionsForComponent$(
                    spell,
                    spellCast.level,
                    gain.spellEffectChoices[spellCastIndex],
                )
                    .pipe(
                        map(conditionSets =>
                            conditionSets.map(conditionSet => ({
                                ...conditionSet,
                                show: conditionSet.show
                                    && !spellCast.hideChoices.includes(conditionSet.condition.name),
                            })),
                        ),
                    );

            }
        }

        return of([]);
    }

    public heightenedDescription(): string {
        return this.activity.heightenedText(this.activity.desc, this.gain?.heightened || CreatureService.character.level);
    }

    public spellLevelFromBaseLevel$(spell: Spell, baseLevel: number): Observable<number> {
        return this._spellPropertiesService.spellLevelFromBaseLevel$(spell, baseLevel);
    }

    public onEffectChoiceChange(): void {
        this._refreshService.prepareDetailToChange(this.creature.type, 'inventory');
        this._refreshService.prepareDetailToChange(this.creature.type, 'activities');
        this._refreshService.processPreparedChanges();
    }

    public ngOnInit(): void {
        if (this.activity.displayOnly) {
            this.allowActivate = false;
        } else {
            this._subscribeToChanges();
        }
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _subscribeToChanges(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (stringsIncludeCaseInsensitive(['activities', 'all', this.creature.type], target)) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    stringEqualsCaseInsensitive(view.creature, this.creature.type) &&
                    stringsIncludeCaseInsensitive(['activities', 'all'], view.target)
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

}
