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
        return condition.get_Choices(this.characterService, conditionGain.source != "Manual", conditionGain.heightened);
    }

    change_ConditionChoice(gain: ConditionGain, condition: Condition, oldChoice: string) {
        this.conditionsService.change_ConditionChoice(this.get_Creature(), gain, condition, oldChoice, this.characterService, this.itemsService)
        this.refreshService.process_ToChange();
        this.update_Condition();
    }

    change_ConditionStage(gain: ConditionGain, condition: Condition, choices: string[], change: number) {
        this.conditionsService.change_ConditionStage(this.get_Creature(), gain, condition, choices, change, this.characterService, this.itemsService)
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
                activityGain.get_OriginalActivity(this.activitiesService)?.get_Cooldown(this.get_Creature(), this.characterService);
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
