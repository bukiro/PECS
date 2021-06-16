import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Activity } from 'src/app/Activity';
import { TraitsService } from 'src/app/traits.service';
import { SpellsService } from 'src/app/spells.service';
import { CharacterService } from 'src/app/character.service';
import { ActivitiesService } from 'src/app/activities.service';
import { TimeService } from 'src/app/time.service';
import { ActivityGain } from 'src/app/ActivityGain';
import { ItemActivity } from 'src/app/ItemActivity';
import { ConditionsService } from 'src/app/conditions.service';
import { Condition } from 'src/app/Condition';
import { SpellCast } from 'src/app/SpellCast';
import { ConditionGain } from 'src/app/ConditionGain';

@Component({
    selector: 'app-activityContent',
    templateUrl: './activityContent.component.html',
    styleUrls: ['./activityContent.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityContentComponent implements OnInit {

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

    get_Activities(name: string) {
        return this.activitiesService.get_Activities(name);
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
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
        return this.activity.get_Heightened(this.activity.desc, this.get_Character().level);
    }

    on_EffectChoiceChange() {
        this.characterService.set_ToChange(this.creature, "inventory");
        this.characterService.set_ToChange(this.creature, "activities");
        this.characterService.process_ToChange();
    }

    finish_Loading() {
        this.characterService.get_Changed()
            .subscribe((target) => {
                if (["activities", "all", this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.characterService.get_ViewChanged()
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

}
