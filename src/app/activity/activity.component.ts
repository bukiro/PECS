import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Activity } from '../Activity';
import { TraitsService } from '../traits.service';
import { SpellsService } from '../spells.service';
import { CharacterService } from '../character.service';
import { ActivitiesService } from '../activities.service';
import { TimeService } from '../time.service';
import { ItemsService } from '../items.service';
import { ActivityGain } from '../ActivityGain';
import { ItemActivity } from '../ItemActivity';
import { Feat } from '../Feat';
import { Character } from '../Character';
import { ConditionsService } from '../conditions.service';
import { Condition } from '../Condition';
import { SpellCast } from '../SpellCast';
import { Creature } from '../Creature';
import { EffectsService } from '../effects.service';
import { ConditionGain } from '../ConditionGain';

@Component({
    selector: 'app-activity',
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityComponent implements OnInit {

    @Input()
    creature: string = "Character";
    @Input()
    activity: Activity | ItemActivity;
    @Input()
    gain: ActivityGain | ItemActivity;
    @Input()
    allowActivate: boolean = false;
    @Input()
    isSubItem: boolean = false;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private traitsService: TraitsService,
        private spellsService: SpellsService,
        private activitiesService: ActivitiesService,
        private timeService: TimeService,
        private itemsService: ItemsService,
        private conditionsService: ConditionsService,
        private effectsService: EffectsService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Creature(creature: string = this.creature) {
        return this.characterService.get_Creature(creature) as Creature;
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

    get_ActivationTraits(activity: Activity) {
        switch (activity.activationType) {
            case "Command":
                return ["Auditory", "Concentrate"];
            case "Envision":
                return ["Concentrate"];
            case "Interact":
                return ["Manipulate"];
            default:
                return [];
        }
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

    get_ActivitySpell() {
        if (this.activity.castSpells.length) {
            let spell = this.get_Spells(this.activity.castSpells[0].name)[0];
            if (spell) {
                return { spell: spell, gain: this.activity.castSpells[0].spellGain, cast: this.activity.castSpells[0] };
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    on_Activate(gain: ActivityGain | ItemActivity, activity: Activity | ItemActivity, activated: boolean, target: string) {
        this.activitiesService.activate_Activity(this.get_Creature(), target, this.characterService, this.conditionsService, this.itemsService, this.spellsService, gain, activity, activated);
    }

    on_ActivateFuseStance(activated: boolean) {
        this.gain.active = activated;
        this.get_FusedStances().forEach(gain => {
            let activity = (gain instanceof ItemActivity ? gain : this.get_Activities(gain.name)[0])
            if (activity && activated != gain.active) {
                this.activitiesService.activate_Activity(this.get_Creature(), "Character", this.characterService, this.conditionsService, this.itemsService, this.spellsService, gain, activity, activated);
            }
        })
    }

    on_ManualRestoreCharge() {
        this.gain.chargesUsed = Math.max(this.gain.chargesUsed - 1, 0);
        if (this.gain.chargesUsed == 0) {
            this.gain.activeCooldown = 0;
        }
    }

    on_ManualEndCooldown() {
        this.gain.activeCooldown = 0;
        this.gain.chargesUsed = 0;
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_FeatsShowingOn(activityName: string) {
        if (activityName) {
            return this.characterService.get_FeatsShowingOn(activityName)
                .sort((a, b) => {
                    if (a.name > b.name) {
                        return 1;
                    }
                    if (a.name < b.name) {
                        return -1;
                    }
                    return 0;
                });;
        } else {
            return []
        }
    }


    get_ConditionsShowingOn(activityName: string) {
        if (activityName) {
            return this.characterService.get_ConditionsShowingOn(this.get_Creature(), activityName)
                .sort((a, b) => {
                    if (a.condition.name > b.condition.name) {
                        return 1;
                    }
                    if (a.condition.name < b.condition.name) {
                        return -1;
                    }
                    return 0;
                });;
        } else {
            return []
        }
    }

    get_ActivityGainsShowingOn(objectName: string) {
        if (objectName) {
            return this.characterService.get_OwnedActivities(this.get_Creature())
                .filter((gain: ItemActivity | ActivityGain) =>
                    (gain._className == "ItemActivity" ? [gain as ItemActivity] : this.get_Activities(gain.name))
                        .find((activity: ItemActivity | Activity) =>
                            activity.hints
                                .find(hint =>
                                    hint.showon.split(",")
                                        .find(showon =>
                                            showon.trim().toLowerCase() == objectName.toLowerCase()
                                        )
                                )
                        )
                )
                .sort((a, b) => {
                    if (a.name > b.name) {
                        return 1;
                    }
                    if (a.name < b.name) {
                        return -1;
                    }
                    return 0;
                });
        } else {
            return []
        }
    }

    get_ActivitiesFromGain(gain: ActivityGain | ItemActivity) {
        return gain instanceof ItemActivity ? [gain] : this.get_Activities(gain.name)
    }

    get_FuseStanceFeat() {
        if (this.get_Creature().type == "Character") {
            let character = this.get_Creature() as Character;
            if (character.get_FeatsTaken(0, character.level, "Fuse Stance").length) {
                return character.customFeats.filter(feat => feat.name == "Fuse Stance")[0];
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    get_FusedStances() {
        let feat: Feat = this.get_FuseStanceFeat();
        if (feat) {
            return this.characterService.get_OwnedActivities(this.get_Creature())
                .filter((gain: ItemActivity | ActivityGain) => feat.data?.["stances"]?.includes(gain.name))
        }
    }

    get_Activities(name: string) {
        return this.activitiesService.get_Activities(name);
    }

    get_ExternallyDisabled() {
        return this.effectsService.get_EffectsOnThis(this.get_Creature(), this.activity.name + " Disabled").length;
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.spellsService.get_Spells(name, type, tradition);
    }

    get_SpellTarget() {
        if (this.activity.castSpells.length) {
            //The SpellCast may limit the spell targets. If not, get the available targets from the Spell, or return "" for non-allies.
            return this.activity.castSpells[0].target || this.get_Spells(this.activity.castSpells[0].name)[0]?.target || "";
        } else {
            return "no spell";
        }
    }

    get_SpellCasts() {
        if (this.gain) {
            while (this.gain.spellEffectChoices.length < this.activity.castSpells.length) {
                this.gain.spellEffectChoices.push([]);
            }
        }
        return this.activity.castSpells;
    }

    get_ActivityConditions() {
        //For all conditions that are included with this activity, create an effectChoice on the gain and set it to the default choice, if any. Add the name for later copyChoiceFrom actions.
        let conditionSets: { gain: ConditionGain, condition: Condition }[] = [];
        let gain = this.gain;
        if (gain) {
            this.activity.gainConditions
                .map(conditionGain => { return { gain: conditionGain, condition: this.conditionsService.get_Conditions(conditionGain.name)[0] } })
                .forEach((conditionSet, index) => {
                    //Create the temporary list of currently available choices.
                    conditionSet.condition?.get_Choices(this.characterService, true, (conditionSet.gain.heightened ? conditionSet.gain.heightened : conditionSet.condition.minLevel));
                    //Add the condition to the selection list. Conditions with no choices, with hideChoices or with copyChoiceFrom will not be displayed.
                    conditionSets.push(conditionSet);
                    //Then if the gain doesn't have a choice at that index or the choice isn't among the condition's choices, insert or replace that choice on the gain.
                    while (!gain.effectChoices.length || gain.effectChoices.length < index - 1) {
                        gain.effectChoices.push({ condition: conditionSet.condition.name, choice: conditionSet.condition.choice });
                    }
                    if (!conditionSet.condition._choices.includes(gain.effectChoices?.[index]?.choice)) {
                        gain.effectChoices[index] = { condition: conditionSet.condition.name, choice: conditionSet.condition.choice };
                    }
                })
        }
        return conditionSets;
    }

    get_SpellConditions(spellCast: SpellCast, spellCastIndex: number) {
        //For all conditions that are included with this spell on this level, create an effectChoice on the gain at the index of this spellCast and set it to the default choice, if any. Add the name for later copyChoiceFrom actions.
        let conditionSets: { gain: ConditionGain, condition: Condition }[] = [];
        let gain = this.gain;
        //Setup the spellEffectChoice collection for this SpellCast.
        while (!gain.spellEffectChoices.length || gain.spellEffectChoices.length < spellCastIndex - 1) {
            gain.spellEffectChoices.push([]);
        }
        if (gain) {
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
                if (target == "activities" || target == "all" || target.toLowerCase() == this.creature.toLowerCase()) {
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
