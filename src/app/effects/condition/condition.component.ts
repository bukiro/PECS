import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { AnimalCompanion } from 'src/app/AnimalCompanion';
import { Character } from 'src/app/Character';
import { CharacterService } from 'src/app/character.service';
import { Condition } from 'src/app/Condition';
import { ConditionGain } from 'src/app/ConditionGain';
import { ConditionsService } from 'src/app/conditions.service';
import { ItemsService } from 'src/app/items.service';
import { TimeService } from 'src/app/time.service';
import { TraitsService } from 'src/app/traits.service';
import { Creature } from 'src/app/Creature';
import { ActivitiesService } from 'src/app/activities.service';
import { RefreshService } from 'src/app/refresh.service';

@Component({
    selector: 'app-condition',
    templateUrl: './condition.component.html',
    styleUrls: ['./condition.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConditionComponent implements OnInit {

    @Input()
    conditionGain: ConditionGain;
    @Input()
    condition: Condition;
    @Input()
    showItem: string = "";
    @Input()
    creature: string = "Character"
    @Input()
    fullDisplay: boolean = false;
    @Output()
    showItemMessage = new EventEmitter<string>();

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private refreshService: RefreshService,
        private timeService: TimeService,
        private itemsService: ItemsService,
        private conditionsService: ConditionsService,
        private traitsService: TraitsService,
        private activitiesService: ActivitiesService
    ) { }

    toggle_Item(name: string) {
        if (this.showItem == name) {
            this.showItem = "";
        } else {
            this.showItem = name;
        }
        this.showItemMessage.emit(this.showItem);
    }

    get_ShowItem() {
        return this.showItem;
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature) as Creature;
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_Duration(duration: number) {
        return this.timeService.get_Duration(duration);
    }

    get_IsInformationalCondition() {
        return this.condition.get_IsInformationalCondition(this.get_Creature(), this.characterService, this.conditionGain);
    }

    set_ConditionDuration(gain: ConditionGain, turns: number) {
        gain.duration = turns;
        gain.maxDuration = gain.duration;
        this.refreshService.set_ToChange(this.creature, "effects");
        this.refreshService.process_ToChange();
        this.update_Condition();
    }

    change_ConditionDuration(gain: ConditionGain, turns: number) {
        gain.duration += turns;
        gain.maxDuration = gain.duration;
        this.refreshService.set_ToChange(this.creature, "effects");
        this.refreshService.process_ToChange();
        this.update_Condition();
    }

    change_ConditionValue(gain: ConditionGain, oldValue: number, change: number = 0) {
        if (change) {
            gain.value += change;
        } else {
            change = gain.value - oldValue;
        }
        if (gain.name == "Drained" && change < 0) {
            //When you lower your drained value, you regain Max HP, but not the lost HP.
            //Because HP is Max HP - Damage, we increase damage to represent not regaining the HP.
            //We subtract level*change from damage because change is negative.
            this.get_Creature().health.damage == Math.max(0, (this.get_Creature().health.damage - (this.get_Creature().level * change)));
        }
        gain.showValue = false;
        this.refreshService.set_ToChange(this.creature, "effects");
        this.refreshService.process_ToChange();
        this.update_Condition();
    }

    change_ConditionRadius(gain: ConditionGain, change: number) {
        gain.radius += change;
    }

    get_ConditionChoices(conditionGain: ConditionGain, condition: Condition) {
        if (conditionGain.source == "Manual") {
            return condition.get_Choices(this.characterService, false);
        } else {
            return condition.get_Choices(this.characterService, true, conditionGain.heightened);
        }
    }

    change_ConditionChoice(gain: ConditionGain, condition: Condition, oldChoice: string) {
        let creature = this.get_Creature();
        let conditionDidSomething: boolean = false;
        if (this.creature != "Familiar" && oldChoice != gain.choice) {
            //Remove any items that were granted by the previous choice.
            if (oldChoice) {
                gain.gainItems.filter(gainItem => gainItem.conditionChoiceFilter.includes(oldChoice)).forEach(gainItem => {
                    this.conditionsService.remove_ConditionItem(creature as Character | AnimalCompanion, this.characterService, this.itemsService, gainItem);
                });
            }
            //Add any items that are granted by the new choice.
            if (gain.choice) {
                gain.gainItems.filter(gainItem => gainItem.conditionChoiceFilter.includes(gain.choice)).forEach(gainItem => {
                    conditionDidSomething = true;
                    this.conditionsService.add_ConditionItem(creature as Character | AnimalCompanion, this.characterService, this.itemsService, gainItem, condition);
                });
            }
        }
        if (oldChoice != gain.choice) {
            let creature = this.get_Creature();
            //Remove any conditions that were granted by the previous choice, unless they are persistent (but still remove them if they are ignorePersistentAtChoiceChange).
            if (oldChoice) {
                condition.gainConditions.filter(extraCondition => extraCondition.conditionChoiceFilter.includes(oldChoice)).forEach(extraCondition => {
                    let addCondition: ConditionGain = Object.assign<ConditionGain, ConditionGain>(new ConditionGain(), JSON.parse(JSON.stringify(extraCondition))).recast();
                    addCondition.source = gain.name;
                    let originalCondition = this.characterService.get_Conditions(addCondition.name)[0];
                    if (!(addCondition.persistent || originalCondition?.persistent) || addCondition.ignorePersistentAtChoiceChange) {
                        this.characterService.remove_Condition(creature, addCondition, false, false, true, true, true);
                    }
                })
            }
            //Add any conditions that are granted by the new choice.
            if (gain.choice) {
                condition.gainConditions.filter(extraCondition => extraCondition.conditionChoiceFilter.includes(gain.choice)).forEach(extraCondition => {
                    conditionDidSomething = true;
                    let addCondition: ConditionGain = Object.assign<ConditionGain, ConditionGain>(new ConditionGain, JSON.parse(JSON.stringify(extraCondition))).recast();
                    if (!addCondition.heightened) {
                        addCondition.heightened = gain.heightened;
                    }
                    addCondition.source = gain.name;
                    addCondition.parentID = gain.id;
                    addCondition.apply = true;
                    this.characterService.add_Condition(creature, addCondition, false, gain);
                })
            }
            //If the current duration is locking the time buttons, refresh the time bar after the change.
            if (gain.duration == 1 || gain.nextStage) {
                this.refreshService.set_ToChange("Character", "time");
            }
            //If the current duration is the default duration of the previous choice, then set the default duration for the current choice. This lets us change the choice directly after adding the condition if we made a mistake.
            if (gain.duration == condition.get_DefaultDuration(oldChoice, gain.heightened).duration) {
                gain.duration = condition.get_DefaultDuration(gain.choice, gain.heightened).duration;
                //Also set the maxDuration to the new value as we have effectively restarted the counter.
                gain.maxDuration = gain.duration;
                //If the new duration is locking the time buttons, refresh the time bar after the change.
                if (gain.duration == 1) {
                    this.refreshService.set_ToChange("Character", "time");
                }
            } else if (gain.duration == condition.get_DefaultDuration(oldChoice, gain.heightened).duration + 2) {
                //If the current duration is the default duration of the previous choice PLUS 2, then set the default duration for the current choice, plus 2.
                gain.duration = condition.get_DefaultDuration(gain.choice, gain.heightened).duration + 2;
                //Also set the maxDuration to the new value as we have effectively restarted the counter.
                gain.maxDuration = gain.duration;
            }
            //Show a notification if the new condition has no duration and did nothing, because it will be removed in the next cycle.
            if (!conditionDidSomething && gain.duration == 0) {
                this.characterService.toastService.show("The condition <strong>" + gain.name + "</strong> was removed because it had no duration and no effect.")
            }

        }
        this.refreshService.set_ToChange(this.creature, "effects");
        if (condition.attackRestrictions.length) {
            this.refreshService.set_ToChange(this.creature, "attacks");
        }
        if (condition.senses.length) {
            this.refreshService.set_ToChange(this.creature, "skills");
        }
        gain.showChoices = false;
        this.refreshService.set_HintsToChange(creature, this.condition.hints, { characterService: this.characterService });
        this.refreshService.process_ToChange();
        this.update_Condition();
    }

    change_ConditionStage(gain: ConditionGain, condition: Condition, choices: string[], change: number) {
        if (change == 0) {
            //If no change, the condition remains, but the onset is reset.
            gain.nextStage = condition.get_ChoiceNextStage(gain.choice);
            this.refreshService.set_ToChange(this.creature, "time");
            this.refreshService.set_ToChange(this.creature, "health");
            this.refreshService.set_ToChange(this.creature, "effects");
        } else {
            let newChoice = choices[choices.indexOf(gain.choice) + change];
            if (newChoice) {
                gain.nextStage = condition.get_ChoiceNextStage(newChoice);
                if (gain.nextStage) {
                    this.refreshService.set_ToChange(this.creature, "time");
                    this.refreshService.set_ToChange(this.creature, "health");
                }
                let oldChoice = gain.choice;
                gain.choice = newChoice;
                this.change_ConditionChoice(gain, condition, oldChoice);
            }
        }
        this.refreshService.process_ToChange();
        this.update_Condition();
    }

    get_HeightenedDescription() {
        if (this.conditionGain) {
            return this.condition.get_Heightened(this.condition.desc, this.conditionGain.heightened);
        } else {
            return this.condition.get_Heightened(this.condition.desc, this.condition.minLevel);
        }

    }

    remove_Condition(conditionGain: ConditionGain) {
        this.characterService.remove_Condition(this.get_Creature(), conditionGain, true);
        this.refreshService.set_Changed("close-popovers");
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.refreshService.get_Changed
                .subscribe((target) => {
                    if (target == "effects" || target == "all" || target == this.creature) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (view.creature == this.creature && ["effects", "all"].includes(view.target)) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    get_Activities(name: string = "") {
        return this.activitiesService.get_Activities(name);
    }

    get_ConditionActivities() {
        if (this.conditionGain) {
            this.conditionGain.gainActivities.forEach(activityGain => {
                activityGain.heightened = this.conditionGain.heightened;
                this.get_Activities(activityGain.name).forEach(actualActivity => { actualActivity.get_Cooldown(this.get_Creature(), this.characterService) })
            })
            return this.conditionGain.gainActivities;
        } else {
            return [];
        }
    }

    update_Condition() {
        //This updates any gridicon that has this condition gain's id set as its update id.
        if (this.conditionGain.id) {
            this.refreshService.set_Changed(this.conditionGain.id);
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
