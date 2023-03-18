import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Activity } from 'src/app/classes/Activity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Character } from 'src/app/classes/Character';
import { Condition } from 'src/app/classes/Condition';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { Spell } from 'src/app/classes/Spell';
import { SpellCast } from 'src/app/classes/SpellCast';
import { Trait } from 'src/app/classes/Trait';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ConditionPropertiesService } from 'src/libs/shared/services/condition-properties/condition-properties.service';
import { ActivitiesDataService } from 'src/libs/shared/services/data/activities-data.service';
import { ConditionsDataService } from 'src/libs/shared/services/data/conditions-data.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';

@Component({
    selector: 'app-activity-content',
    templateUrl: './activity-content.component.html',
    styleUrls: ['./activity-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityContentComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
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
    ) {
        super();
    }

    public get isManualMode(): boolean {
        return SettingsService.isManualMode;
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsDataService.traitFromName(traitName);
    }

    public spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

    public durationDescription(duration: number, includeTurnState = true, inASentence = false): string {
        return this._durationsService.durationDescription(duration, includeTurnState, inASentence);
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

    public spellConditions(spellCast: SpellCast, spellCastIndex: number): Array<{ gain: ConditionGain; condition: Condition }> {
        // For all conditions that are included with this spell on this level,
        // create an effectChoice on the gain at the index of this spellCast and set it to the default choice, if any.
        // Add the name for later copyChoiceFrom actions.
        const conditionSets: Array<{ gain: ConditionGain; condition: Condition }> = [];
        const gain = this.gain;

        //Setup the spellEffectChoice collection for this SpellCast.
        if (gain) {
            while (!gain.spellEffectChoices.length || gain.spellEffectChoices.length < spellCastIndex - 1) {
                gain.spellEffectChoices.push([]);
            }

            const spell = this._spellsDataService.spellFromName(spellCast.name);

            spell.heightenedConditions(spellCast.level)
                .map(conditionGain => ({
                    gain: conditionGain,
                    condition: this._conditionsDataService.conditionFromName(conditionGain.name),
                }))
                .forEach((conditionSet, index) => {
                    //Create the temporary list of currently available choices.
                    this._conditionPropertiesService.cacheEffectiveChoices(conditionSet.condition, spellCast.level);
                    //Add the condition to the selection list. Conditions with no choices or with automatic choices will not be displayed.
                    conditionSets.push(conditionSet);

                    // Then if the gain doesn't have a choice at that index or the choice isn't among the condition's choices,
                    // insert or replace that choice on the gain.
                    while (!gain.spellEffectChoices[spellCastIndex].length || gain.spellEffectChoices[spellCastIndex].length < index - 1) {
                        gain.spellEffectChoices[spellCastIndex].push(
                            { condition: conditionSet.condition.name, choice: conditionSet.condition.choice },
                        );
                    }

                    if (!conditionSet.condition.$choices.includes(gain.spellEffectChoices[spellCastIndex]?.[index]?.choice)) {
                        gain.spellEffectChoices[spellCastIndex][index] =
                            { condition: conditionSet.condition.name, choice: conditionSet.condition.choice };
                    }
                });
        }

        return conditionSets;
    }

    public heightenedDescription(): string {
        return this.activity.heightenedText(this.activity.desc, this.gain?.heightened || this._character.level);
    }

    public spellLevelFromBaseLevel(spell: Spell, baseLevel: number): number {
        let levelNumber = baseLevel;

        if ((!levelNumber && (spell.traits.includes('Cantrip'))) || levelNumber === -1) {
            levelNumber = this._character.maxSpellLevel();
        }

        levelNumber = Math.max(levelNumber, (spell.levelreq || 0));

        return levelNumber;
    }

    public onEffectChoiceChange(): void {
        this._refreshService.prepareDetailToChange(this.creature, 'inventory');
        this._refreshService.prepareDetailToChange(this.creature, 'activities');
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
                if (['activities', 'all', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    view.creature.toLowerCase() === this.creature.toLowerCase() &&
                    ['activities', 'all'].includes(view.target.toLowerCase())
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

}
