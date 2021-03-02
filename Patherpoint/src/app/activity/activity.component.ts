import { Component, OnInit, Input } from '@angular/core';
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

@Component({
    selector: 'app-activity',
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.css']
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
        public characterService: CharacterService,
        private traitsService: TraitsService,
        private spellsService: SpellsService,
        private activitiesService: ActivitiesService,
        private timeService: TimeService,
        private itemsService: ItemsService,
        private conditionsService: ConditionsService,
        private effectsService: EffectsService
    ) { }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Creature(creature: string = this.creature) {
        return this.characterService.get_Creature(creature) as Creature;
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

    on_Activate(gain: ActivityGain | ItemActivity, activity: Activity | ItemActivity, activated: boolean, target: string) {
        this.activitiesService.activate_Activity(this.get_Creature(), target, this.characterService, this.conditionsService, this.itemsService, this.spellsService, gain, activity, activated);
    }

    on_ActivateFuseStance(activated: boolean) {
        this.gain.active = activated;
        this.get_FusedStances().forEach(gain => {
            let activity = (gain["can_Activate"] ? gain as ItemActivity : this.get_Activities(gain.name)[0])
            this.activitiesService.activate_Activity(this.get_Creature(), "Character", this.characterService, this.conditionsService, this.itemsService, this.spellsService, gain, activity, activated);
        })
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
        return gain.constructor == ItemActivity ? [gain] : this.get_Activities(gain.name)
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
                .filter((gain: ItemActivity | ActivityGain) => gain.name == feat.data["stance1"] || gain.name == feat.data["stance2"])
        }
    }

    get_Activities(name: string) {
        return this.activitiesService.get_Activities(name);
    }

    get_ExternallyDisabled(activity: Activity) {
        return this.effectsService.get_EffectsOnThis(this.get_Creature(), activity.name + " Disabled").length;
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
        //For all conditions that are included with this activity and has choices unlocked, create an effectChoice on the gain and set it to the default choice.
        let conditions: Condition[] = [];
        if (this.gain && !this.activity.hideChoices) {
            this.activity.gainConditions
                .map(conditionGain => { return { gain: conditionGain, condition: this.conditionsService.get_Conditions(conditionGain.name)[0] } })
                .filter(conditionSet => conditionSet.condition?.get_Choices(this.characterService, true, conditionSet.gain.heightened).length > 1)
                .map(conditionSet => conditionSet.condition)
                .forEach((condition, index) => {
                    //Add the condition to the list of conditions that need to display a choice,
                    // then if the gain doesn't have a choice at that index or the choice isn't among the condition's choices, insert or replace that choice on the gain.
                    conditions.push(condition);
                    while (!this.gain.effectChoices.length || this.gain.effectChoices.length < index - 1) {
                        this.gain.effectChoices.push(condition.choice);
                    }
                    if (!condition?.$choices?.includes(this.gain.effectChoices[index])) {
                        this.gain.effectChoices[index] = condition.choice;
                    }
                })
        }
        return conditions;
    }

    get_SpellConditions(spellCast: SpellCast, spellCastIndex: number) {
        //For all conditions that are included with this spell on this level and has choices unlocked, create an effectChoice on the gain and set it to the default choice.
        let conditions: Condition[] = [];
        if (this.gain) {
            let spell = this.spellsService.get_Spells(spellCast.name)[0];
            if (spell?.gainConditions.length) {
                spell.get_HeightenedConditions(spellCast.level)
                    .filter(conditionGain => !conditionGain.hideChoices)
                    .map(conditionGain => this.conditionsService.get_Conditions(conditionGain.name)[0])
                    .filter(condition => condition?.get_Choices(this.characterService, true)?.length > 1)
                    .forEach((condition, index) => {
                        //Add the condition to the list of conditions that need to display a choice,
                        // then if the gain doesn't have a choice at that index or the choice isn't among the condition's choices, insert or replace that choice on the gain.
                        conditions.push(condition);
                        while (!this.gain.spellEffectChoices[spellCastIndex].length || this.gain.spellEffectChoices[spellCastIndex].length < index - 1) {
                            this.gain.spellEffectChoices[spellCastIndex].push(condition.choice);
                        }
                        if (!condition.$choices.includes(this.gain.spellEffectChoices[spellCastIndex][index])) {
                            this.gain.spellEffectChoices[spellCastIndex][index] = condition.choice;
                        }
                    })
            }
        }
        return conditions;
    }

    on_EffectChoiceChange() {
        this.characterService.set_ToChange(this.creature, "inventory");
        this.characterService.set_ToChange(this.creature, "activities");
        this.characterService.process_ToChange();
    }

    ngOnInit() {
        if (this.activity.displayOnly) {
            this.allowActivate = false;
        }
    }

}
