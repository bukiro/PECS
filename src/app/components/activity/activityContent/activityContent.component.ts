import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Activity } from 'src/app/classes/Activity';
import { TraitsService } from 'src/app/services/traits.service';
import { SpellsService } from 'src/app/services/spells.service';
import { CharacterService } from 'src/app/services/character.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { TimeService } from 'src/app/services/time.service';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ConditionsService } from 'src/app/services/conditions.service';
import { Condition } from 'src/app/classes/Condition';
import { SpellCast } from 'src/app/classes/SpellCast';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { Spell } from 'src/app/classes/Spell';

@Component({
    selector: 'app-activityContent',
    templateUrl: './activityContent.component.html',
    styleUrls: ['./activityContent.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityContentComponent implements OnInit, OnDestroy {

    @Input()
    creature = 'Character';
    @Input()
    activity: Activity | ItemActivity;
    @Input()
    gain: ActivityGain | ItemActivity;
    @Input()
    allowActivate = false;
    @Input()
    cooldown = 0;
    @Input()
    maxCharges = 0;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly traitsService: TraitsService,
        private readonly spellsService: SpellsService,
        private readonly activitiesService: ActivitiesDataService,
        private readonly timeService: TimeService,
        private readonly conditionsService: ConditionsService,
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_Traits(traitName = '') {
        return this.traitsService.getTraits(traitName);
    }

    get_Character() {
        return this.characterService.character();
    }

    get_ManualMode() {
        return this.characterService.isManualMode();
    }

    get_CompanionAvailable() {
        return this.characterService.isCompanionAvailable();
    }

    get_FamiliarAvailable() {
        return this.characterService.isFamiliarAvailable();
    }

    get_Duration(duration: number, includeTurnState = true, inASentence = false) {
        return this.timeService.getDurationDescription(duration, includeTurnState, inASentence);
    }

    public get_Activities(name: string): Array<Activity> {
        return this.activitiesService.activities(name);
    }

    public get_Spells(name = '', type = '', tradition = ''): Array<Spell> {
        //If there is a mistake in writing the activity, it shouldn't return ALL spells.
        if (!name && !type && !tradition) {
            return [];
        }

        return this.spellsService.spells(name, type, tradition);
    }

    get_SpellCasts() {
        if (this.gain) {
            while (this.gain.spellEffectChoices.length < this.activity.castSpells.length) {
                this.gain.spellEffectChoices.push([]);
            }
        }

        return this.activity.castSpells;
    }

    get_SpellConditions(spellCast: SpellCast, spellCastIndex: number) {
        //For all conditions that are included with this spell on this level, create an effectChoice on the gain at the index of this spellCast and set it to the default choice, if any. Add the name for later copyChoiceFrom actions.
        const conditionSets: Array<{ gain: ConditionGain; condition: Condition }> = [];
        const gain = this.gain;

        //Setup the spellEffectChoice collection for this SpellCast.
        if (gain) {
            while (!gain.spellEffectChoices.length || gain.spellEffectChoices.length < spellCastIndex - 1) {
                gain.spellEffectChoices.push([]);
            }

            const spell = this.spellsService.spells(spellCast.name)[0];

            spell.heightenedConditions(spellCast.level)
                .map(conditionGain => ({ gain: conditionGain, condition: this.conditionsService.conditions(conditionGain.name)[0] }))
                .forEach((conditionSet, index) => {
                    //Create the temporary list of currently available choices.
                    conditionSet.condition?.effectiveChoices(this.characterService, true, spellCast.level);
                    //Add the condition to the selection list. Conditions with no choices or with automatic choices will not be displayed.
                    conditionSets.push(conditionSet);

                    //Then if the gain doesn't have a choice at that index or the choice isn't among the condition's choices, insert or replace that choice on the gain.
                    while (!gain.spellEffectChoices[spellCastIndex].length || gain.spellEffectChoices[spellCastIndex].length < index - 1) {
                        gain.spellEffectChoices[spellCastIndex].push({ condition: conditionSet.condition.name, choice: conditionSet.condition.choice });
                    }

                    if (!conditionSet.condition.$choices.includes(gain.spellEffectChoices[spellCastIndex]?.[index]?.choice)) {
                        gain.spellEffectChoices[spellCastIndex][index] = { condition: conditionSet.condition.name, choice: conditionSet.condition.choice };
                    }
                });
        }

        return conditionSets;
    }

    get_HeightenedDescription() {
        return this.activity.heightenedText(this.activity.desc, this.gain?.heightened || this.get_Character().level);
    }

    on_EffectChoiceChange() {
        this.refreshService.prepareDetailToChange(this.creature, 'inventory');
        this.refreshService.prepareDetailToChange(this.creature, 'activities');
        this.refreshService.processPreparedChanges();
    }

    finish_Loading() {
        this.changeSubscription = this.refreshService.componentChanged$
            .subscribe(target => {
                if (['activities', 'all', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() == this.creature.toLowerCase() && ['activities', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    public ngOnInit(): void {
        if (this.activity.displayOnly) {
            this.allowActivate = false;
        } else {
            this.finish_Loading();
        }
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
