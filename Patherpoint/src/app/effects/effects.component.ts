import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { EffectsService } from '../effects.service';
import { CharacterService } from '../character.service';
import { ConditionGain } from '../ConditionGain';
import { TimeService } from '../time.service';
import { Condition } from '../Condition';
import { TraitsService } from '../traits.service';
import { v1 as uuidv1 } from 'uuid';
import { ItemsService } from '../items.service';
import { Item } from '../Item';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { Equipment } from '../Equipment';
import { ConditionsService } from '../conditions.service';
import { ItemGain } from '../ItemGain';

@Component({
    selector: 'app-effects',
    templateUrl: './effects.component.html',
    styleUrls: ['./effects.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EffectsComponent implements OnInit {

    @Input()
    creature: string = "Character";
    public showNotApplied: boolean = false;
    public showHidden: boolean = false;
    public showItem: string = "";
    public Math = Math;
    public parseInt = parseInt;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private traitsService: TraitsService,
        private effectsService: EffectsService,
        private characterService: CharacterService,
        private timeService: TimeService,
        private conditionsService: ConditionsService,
        private itemsService: ItemsService
    ) { }
    
    minimize() {
        this.characterService.get_Character().settings.effectsMinimized = !this.characterService.get_Character().settings.effectsMinimized;
    }

    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span(this.creature+"-effects");
        })
    }

    toggle_Item(name: string) {
        if (this.showItem == name) {
            this.showItem = "";
        } else {
            this.showItem = name;
        }
    }

    get_ShowItem() {
        return this.showItem;
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }
    
    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    toggle_NotApplied() {
        this.showNotApplied = !this.showNotApplied;
    }

    toggle_Hidden() {
        this.showHidden = !this.showHidden;
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_Effects() {
        return this.effectsService.get_Effects(this.creature);
    }

    get_Conditions(name: string = "") {
        return this.characterService.get_Conditions(name);
    }

    get_AppliedEffects() {
        return this.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && effect.apply && !effect.hide).sort(function(a,b) {
            if (a.value > b.value) {
                return 1;
            }
            if (a.value < b.value) {
                return -1;
            }
            return 0;
        }).sort(function(a,b) {
            if (a.setValue > b.setValue) {
                return 1;
            }
            if (a.setValue < b.setValue) {
                return -1;
            }
            return 0;
        }).sort(function(a,b) {
            if (a.target > b.target) {
                return 1;
            }
            if (a.target < b.target) {
                return -1;
            }
            return 0;
        });
    }

    get_NotAppliedEffects() {
        return this.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && !effect.apply && !effect.hide);
    }

    get_HiddenEffects() {
        return this.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && effect.hide);
    }

    get_AppliedConditions(apply: boolean) {
        return this.characterService.get_AppliedConditions(this.get_Creature()).filter(condition => condition.apply == apply).sort(function(a,b) {
            if (a.name + a.value + a.choice > b.name + b.value + b.choice) {
                return 1;
            }
            if (a.name + a.value + a.choice < b.name + b.value + b.choice) {
                return -1;
            }
            return 0;
        });
    }

    change_ConditionDuration(gain: ConditionGain, turns: number) {
        gain.duration += turns;
        this.toggle_Item("");
    }

    change_ConditionValue(gain: ConditionGain, change: number) {
        gain.value += change;
        if (gain.name == "Drained" && change < 0) {
            //When you lower your drained value, you regain Max HP, but not the lost HP.
            //Because HP is Max HP - Damage, we increase damage to represent not regaining the HP.
            //We subtract level*change from damage because change is negative.
            this.get_Creature().health.damage -= this.get_Creature().level * change;
        }
        this.toggle_Item("");
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.process_ToChange();
    }

    change_ConditionChoice(gain: ConditionGain, condition: Condition, oldChoice: string) {
        let creature = this.get_Creature();
        if (this.creature != "Familiar" && oldChoice != gain.choice) {
            //Remove any items that were granted by the previous choice.
            if (oldChoice) {
                gain.gainItems.filter(gainItem => gainItem.conditionChoiceFilter == oldChoice).forEach(gainItem => {
                    this.conditionsService.remove_ConditionItem(creature as Character|AnimalCompanion, this.characterService, this.itemsService, gainItem);
                });
            }
            //Add any items that are granted by the new choice.
            if (gain.choice) {
                gain.gainItems.filter(gainItem => gainItem.conditionChoiceFilter == gain.choice).forEach(gainItem => {
                    this.conditionsService.add_ConditionItem(creature as Character|AnimalCompanion, this.characterService, this.itemsService, gainItem, condition);
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
        this.characterService.process_ToChange();
    }

    change_ConditionStage(gain: ConditionGain, condition: Condition, change: number) {
        this.characterService.change_ConditionStage(this.get_Creature(), gain, condition, change);
    }

    get_Duration(duration: number) {
        return this.timeService.get_Duration(duration);
    }

    remove_Condition(conditionGain: ConditionGain) {
        this.characterService.remove_Condition(this.get_Creature(), conditionGain, true);
    }

    get_LabelID() {
        return uuidv1();
    }

    finish_Loading() {
        if (this.characterService.still_loading()) {
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
                if (view.creature == "Character" && view.target == "span") {
                    this.set_Span();
                }
            });return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}