import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Activity } from 'src/app/classes/Activity';
import { TraitsService } from 'src/app/services/traits.service';
import { SpellsService } from 'src/app/services/spells.service';
import { CharacterService } from 'src/app/services/character.service';
import { ActivitiesService } from 'src/app/services/activities.service';
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
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityContentComponent implements OnInit, OnDestroy {

    @Input()
    creature: string = "Character";
    @Input()
    activity: Activity | ItemActivity;
    @Input()
    gain: ActivityGain | ItemActivity;
    @Input()
    allowActivate: boolean = false;
    @Input()
    cooldown: number = 0;
    @Input()
    maxCharges: number = 0;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private refreshService: RefreshService,
        private traitsService: TraitsService,
        private spellsService: SpellsService,
        private activitiesService: ActivitiesService,
        private timeService: TimeService,
        private conditionsService: ConditionsService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_ManualMode() {
        return this.characterService.get_ManualMode();
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }

    get_FamiliarAvailable() {
        return this.characterService.get_FamiliarAvailable();
    }

    get_Resonant() {
        if ((this.activity as ItemActivity).resonant) {
            return true;
        } else {
            return false;
        }
    }

    get_Duration(duration: number, includeTurnState: boolean = true, inASentence: boolean = false) {
        return this.timeService.get_Duration(duration, includeTurnState, inASentence);
    }

    public get_Activities(name: string): Activity[] {
        return this.activitiesService.get_Activities(name);
    }

    public get_Spells(name: string = "", type: string = "", tradition: string = ""): Spell[] {
        //If there is a mistake in writing the activity, it shouldn't return ALL spells.
        if (!name && !type && !tradition) {
            return [];
        }
        return this.spellsService.get_Spells(name, type, tradition);
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
        let conditionSets: { gain: ConditionGain, condition: Condition }[] = [];
        let gain = this.gain;
        //Setup the spellEffectChoice collection for this SpellCast.
        if (gain) {
            while (!gain.spellEffectChoices.length || gain.spellEffectChoices.length < spellCastIndex - 1) {
                gain.spellEffectChoices.push([]);
            }
            let spell = this.spellsService.get_Spells(spellCast.name)[0];
            spell.get_HeightenedConditions(spellCast.level)
                .map(conditionGain => { return { gain: conditionGain, condition: this.conditionsService.get_Conditions(conditionGain.name)[0] } })
                .forEach((conditionSet, index) => {
                    //Create the temporary list of currently available choices.
                    conditionSet.condition?.get_Choices(this.characterService, true, spellCast.level);
                    //Add the condition to the selection list. Conditions with no choices or with automatic choices will not be displayed.
                    conditionSets.push(conditionSet);
                    //Then if the gain doesn't have a choice at that index or the choice isn't among the condition's choices, insert or replace that choice on the gain.
                    while (!gain.spellEffectChoices[spellCastIndex].length || gain.spellEffectChoices[spellCastIndex].length < index - 1) {
                        gain.spellEffectChoices[spellCastIndex].push({ condition: conditionSet.condition.name, choice: conditionSet.condition.choice });
                    }
                    if (!conditionSet.condition._choices.includes(gain.spellEffectChoices[spellCastIndex]?.[index]?.choice)) {
                        gain.spellEffectChoices[spellCastIndex][index] = { condition: conditionSet.condition.name, choice: conditionSet.condition.choice };
                    }
                })
        }
        return conditionSets;
    }

    get_HeightenedDescription() {
        return this.activity.get_Heightened(this.activity.desc, this.gain?.heightened || this.get_Character().level);
    }

    on_EffectChoiceChange() {
        this.refreshService.set_ToChange(this.creature, "inventory");
        this.refreshService.set_ToChange(this.creature, "activities");
        this.refreshService.process_ToChange();
    }

    finish_Loading() {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe((target) => {
                if (["activities", "all", this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe((view) => {
                if (view.creature.toLowerCase() == this.creature.toLowerCase() && ["activities", "all"].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnInit() {
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
