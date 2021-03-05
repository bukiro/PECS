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
    @Output()
    showItemMessage = new EventEmitter<string>();

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private timeService: TimeService,
        private itemsService: ItemsService,
        private conditionsService: ConditionsService,
        private traitsService: TraitsService
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

    change_ConditionDuration(gain: ConditionGain, condition: Condition, turns: number) {
        gain.duration += turns;
        gain.maxDuration = gain.duration;
        this.toggle_Item("");
        //Conditions who use their own duration in their effects need to update effects after changing duration.
        if (condition?.effects.some(effect => effect.setValue?.includes("parentcondition.duration") || effect.value?.includes("parentcondition.duration"))) {
            this.characterService.set_ToChange(this.creature, "effects");
            this.characterService.process_ToChange();
        }
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
            this.get_Creature().health.damage -= this.get_Creature().level * change;
        }
        this.toggle_Item("");
        gain.showValue = false;
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.process_ToChange();
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
        if (this.creature != "Familiar" && oldChoice != gain.choice) {
            //Remove any items that were granted by the previous choice.
            if (oldChoice) {
                gain.gainItems.filter(gainItem => gainItem.conditionChoiceFilter == oldChoice).forEach(gainItem => {
                    this.conditionsService.remove_ConditionItem(creature as Character | AnimalCompanion, this.characterService, this.itemsService, gainItem);
                });
            }
            //Add any items that are granted by the new choice.
            if (gain.choice) {
                gain.gainItems.filter(gainItem => gainItem.conditionChoiceFilter == gain.choice).forEach(gainItem => {
                    this.conditionsService.add_ConditionItem(creature as Character | AnimalCompanion, this.characterService, this.itemsService, gainItem, condition);
                });
            }
        }
        if (oldChoice != gain.choice) {
            let creature = this.get_Creature();
            //Remove any conditions that were granted by the previous choice.
            if (oldChoice) {
                condition.gainConditions.filter(extraCondition => extraCondition.conditionChoiceFilter == oldChoice).forEach(extraCondition => {
                    let addCondition = Object.assign(new ConditionGain, JSON.parse(JSON.stringify(extraCondition)));
                    addCondition.source = gain.name;
                    this.characterService.remove_Condition(creature, addCondition, false)
                })
            }
            //Add any conditions that are granted by the new choice.
            if (gain.choice) {
                condition.gainConditions.filter(extraCondition => extraCondition.conditionChoiceFilter == gain.choice).forEach(extraCondition => {
                    let addCondition = Object.assign(new ConditionGain, JSON.parse(JSON.stringify(extraCondition)));
                    if (!addCondition.heightened) {
                        addCondition.heightened = gain.heightened;
                    }
                    addCondition.source = gain.name;
                    addCondition.apply = true;
                    this.characterService.add_Condition(creature, addCondition, false)
                })
            }
        }
        this.characterService.set_ToChange(this.creature, "effects");
        if (condition.attackRestrictions.length) {
            this.characterService.set_ToChange(this.creature, "attacks");
        }
        if (condition.senses.length) {
            this.characterService.set_ToChange(this.creature, "skills");
        }
        gain.showChoices = false;
        this.characterService.process_ToChange();
    }

    change_ConditionStage(gain: ConditionGain, condition: Condition, change: number) {
        this.characterService.change_ConditionStage(this.get_Creature(), gain, condition, change);
    }

    remove_Condition(conditionGain: ConditionGain) {
        this.characterService.remove_Condition(this.get_Creature(), conditionGain, true);
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (target == "effects" || target == "all" || target == this.creature) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature == this.creature && ["effects", "all"].includes(view.target)) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
