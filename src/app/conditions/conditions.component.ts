import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { TraitsService } from '../traits.service';
import { ConditionGain } from '../ConditionGain';
import { ConditionsService } from '../conditions.service';
import { Condition } from '../Condition';
import { TimeService } from '../time.service';
import { EffectsService } from '../effects.service';
import { ItemProperty } from '../ItemProperty';
import { EffectGain } from '../EffectGain';
import { ItemsService } from '../items.service';
import { Creature } from '../Creature';
import { Skill } from '../Skill';
import { Ability } from '../Ability';
import { Activity } from '../Activity';
import { ActivitiesService } from '../activities.service';
import { Equipment } from '../Equipment';
import { Consumable } from '../Consumable';
import { Effect } from '../Effect';
import { NgbPopoverConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-conditions',
    templateUrl: './conditions.component.html',
    styleUrls: ['./conditions.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConditionsComponent implements OnInit {

    public endOn: number = 5;
    public value: number = 1;
    public heightened: number = 1;
    public showList: string = "";
    public showItem: string = "";
    public wordFilter: string = "";
    public permanent: boolean = true;
    public days: number = 0;
    public hours: number = 0;
    public minutes: number = 0;
    public turns: number = 0;
    private purpose: "conditions" | "customeffects" = "conditions";
    public newEffect: EffectGain = new EffectGain();
    public validationError: string[] = [];
    public validationResult: string[] = [];
    public parseInt = parseInt;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private activitiesService: ActivitiesService,
        private conditionsService: ConditionsService,
        private effectsService: EffectsService,
        private itemsService: ItemsService,
        private timeService: TimeService,
        private traitsService: TraitsService,
        popoverConfig: NgbPopoverConfig
    ) {
        popoverConfig.autoClose = "outside";
        popoverConfig.container = "body";
        //For touch compatibility, this openDelay prevents the popover from closing immediately on tap because a tap counts as hover and then click;
        popoverConfig.openDelay = 1;
        popoverConfig.placement = "auto";
        popoverConfig.popoverClass = "list-item sublist";
        popoverConfig.triggers = "hover:click";
    }

    toggle_List(type) {
        if (this.showList == type) {
            this.showList = "";
        } else {
            this.showList = type;
        }
    }

    toggle_Item(type) {
        if (this.showItem == type) {
            this.showItem = "";
        } else {
            this.showItem = type;
        }
    }

    get_ShowItem() {
        return this.showItem;
    }

    get_ShowList() {
        return this.showList;
    }

    toggle_Purpose(purpose: "conditions" | "customeffects") {
        this.purpose = purpose;
    }

    get_ShowPurpose() {
        return this.purpose;
    }

    //If you don't use trackByIndex on certain inputs, you lose focus everytime the value changes. I don't get that, but I'm using it now.
    trackByIndex(index: number, obj: any): any {
        return index;
    }

    check_Filter() {
        if (this.wordFilter.length < 5 && this.showList) {
            this.showList = "";
        }
    }

    set_Filter() {
        if (this.wordFilter) {
            this.showList = "All";
        }
    }

    get_EndOn() {
        return this.endOn;
    }

    still_loading() {
        return this.conditionsService.still_loading() || this.characterService.still_loading();
    }

    toggleConditionsMenu() {
        this.characterService.toggle_Menu("conditions");
    }

    get_ConditionsMenuState() {
        return this.characterService.get_ConditionsMenuState();
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }

    get_FamiliarAvailable() {
        return this.characterService.get_FamiliarAvailable();
    }

    get_Companion() {
        return this.characterService.get_Companion();
    }

    get_Familiar() {
        return this.characterService.get_Familiar();
    }

    get_Creatures(companionAvailable: boolean = undefined, familiarAvailable: boolean = undefined) {
        return this.characterService.get_Creatures(companionAvailable, familiarAvailable);
    }

    get_VisibleConditionsSet(type: string) {
        let typeKey = "";
        switch (type) {
            case "Generic":
                typeKey = "generic";
                break;
            case "Activities":
                typeKey = "activities";
                break;
            case "Afflictions":
                typeKey = "afflictions";
                break;
            case "Alchemical Elixirs":
                typeKey = "alchemicalelixirs";
                break;
            case "Alchemical Tools":
                typeKey = "alchemicaltools";
                break;
            case "Ammunition":
                typeKey = "ammunition";
                break;
            case "Blood Magic":
                typeKey = "bloodmagic";
                break;
            case "Feats":
                typeKey = "feats";
                break;
            case "Other Consumables":
                typeKey = "otherconsumables";
                break;
            case "Potions":
                typeKey = "potions";
                break;
            case "Spells":
                typeKey = "spells";
                break;
            case "Talismans":
                typeKey = "talismans";
                break;
            case "Worn Items":
                typeKey = "wornitems";
                break;
            case "Held Items":
                typeKey = "helditems";
                break;
        }

        if (typeKey) {
            return this.get_Conditions("", typeKey).filter(condition =>
                !this.wordFilter || (
                    this.wordFilter && (
                        condition.name.toLowerCase().includes(this.wordFilter.toLowerCase()) ||
                        condition.desc.toLowerCase().includes(this.wordFilter.toLowerCase())
                    )
                )
            ).sort((a, b) => {
                if (a.name > b.name) {
                    return 1;
                }
                if (a.name < b.name) {
                    return -1;
                }
                return 0;
            })
        }
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_Conditions(name: string = "", type: string = "") {
        return this.conditionsService.get_Conditions(name, type);
    }

    set_Permanent() {
        this.permanent = true;
        this.days = 0;
        this.hours = 0;
        this.minutes = 0;
        this.turns = 0;
    }

    add_Day(days: number) {
        this.days = Math.max(this.days + days, 0);
        this.permanent = false;
    }

    set_Duration() {
        if (this.permanent) {
            this.permanent = false;
        }
    }

    get_ConditionDuration(includeTurn: boolean = true) {
        return this.permanent ? -1 :
            (
                this.days * 144000 +
                this.hours * 6000 +
                this.minutes * 100 +
                this.turns * 10 +
                (includeTurn ? (this.endOn == this.timeService.get_YourTurn() ? 0 : 5) : 0)
            )
    }

    get_ConditionChoices(condition: Condition) {
        return condition.get_Choices(this.characterService, false);
    }

    get_Duration(duration: number = this.get_ConditionDuration()) {
        return this.timeService.get_Duration(duration, true);
    }

    add_Condition(creature: Creature, condition: Condition, duration: number = this.get_ConditionDuration(false)) {
        let newGain = new ConditionGain();
        newGain.name = condition.name;
        if (duration == -1) {
            newGain.duration = duration;
        } else {
            newGain.duration = duration + (this.endOn == this.timeService.get_YourTurn() ? 0 : 5);
        }
        newGain.choice = condition.choice;
        if (condition.hasValue) {
            newGain.value = this.value;
        }
        if (condition.type == "spells") {
            newGain.heightened = this.heightened;
        }
        newGain.source = "Manual";
        this.characterService.add_Condition(creature, newGain, true);
    }

    get_EffectsProperty() {
        return this.effectsService.get_EffectProperties().find(property => !property.parent && property.key == "effects");
    }

    get_EffectValue(creature: Creature, effect: EffectGain) {
        //Fit the custom effect into the box defined by get_SimpleEffects
        let effectsObject = { effects: [effect] }
        let result = this.effectsService.get_SimpleEffects(creature, this.characterService, effectsObject);
        if (result.length) {
            return result;
        } else {
            //If the EffectGain did not produce an effect, return a blank effect instead.
            return [new Effect()];
        }
    }

    numbersOnly(event): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode != 45 && charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    get_Items() {
        return this.itemsService.get_Items();
    }

    get_Inventories() {
        return this.get_Character().inventories;
    }

    get_EffectInvalid() {
        if (!this.newEffect.affected || (!this.newEffect.toggle && !this.newEffect.setValue && this.newEffect.value == "0")) {
            return "This effect will not do anything."
        };
    }

    add_Effect(creature: Creature) {
        let duration: number = this.get_ConditionDuration(false);
        let newLength = creature.effects.push(Object.assign(new EffectGain(), JSON.parse(JSON.stringify(this.newEffect))));
        if (duration == -1) {
            creature.effects[newLength - 1].duration = duration;
        } else {
            creature.effects[newLength - 1].duration = duration + (this.endOn == this.timeService.get_YourTurn() ? 0 : 5);
        }
        creature.effects[newLength - 1].maxDuration = creature.effects[newLength - 1].duration;
        this.characterService.set_ToChange(creature.type, "effects");
        this.characterService.set_ToChange(creature.type, "conditions");
        this.characterService.process_ToChange();
    }

    remove_Effect(creature: Creature, index: number) {
        creature.effects.splice(index, 1);
        this.characterService.set_ToChange(creature.type, "effects");
        this.characterService.set_ToChange(creature.type, "conditions");
        this.characterService.process_ToChange();
    }

    update_Effects(creature: Creature) {
        this.characterService.set_ToChange(creature.type, "effects");
        this.characterService.set_ToChange(creature.type, "conditions");
        this.characterService.process_ToChange();
    }

    validate(propertyData: ItemProperty, index: number) {
        let value = this.newEffect[propertyData.key]
        if (propertyData.key == "value" && propertyData.parent == "effects") {
            if (value && value != "0") {
                let effectGain = new EffectGain;
                effectGain.value = value;
                let effects = this.effectsService.get_SimpleEffects(this.get_Character(), this.characterService, { effects: [effectGain] });
                if (effects.length) {
                    let effect = effects[0];
                    if (effect && effect.value && effect.value != "0" && (parseInt(effect.value) || parseFloat(effect.value))) {
                        if (parseFloat(effect.value) == parseInt(effect.value)) {
                            this.validationError[index] = "";
                            this.validationResult[index] = parseInt(effect.value).toString();
                        } else {
                            this.validationError[index] = "This may result in a decimal value and be turned into a whole number."
                            this.validationResult[index] = parseInt(effect.value).toString();
                        }
                    } else {
                        this.validationError[index] = "This may result in an invalid value or 0. Invalid values will default to 0, and untyped effects without a value will not be displayed."
                        this.validationResult[index] = parseInt(effect.value).toString();
                    }
                } else {
                    this.validationError[index] = "This may result in an invalid value or 0. Invalid values will default to 0, and untyped effects without a value will not be displayed."
                    this.validationResult[index] = "";
                }
            }
        } else if (propertyData.key == "setValue" && propertyData.parent == "effects") {
            if (value && value != "0") {
                let effectGain = new EffectGain;
                effectGain.value = value;
                let effects = this.effectsService.get_SimpleEffects(this.get_Character(), this.characterService, { effects: [effectGain] });
                if (effects.length) {
                    let effect = effects[0];
                    if (effect && effect.value && (parseInt(effect.value) || parseFloat(effect.value)) || parseInt(effect.value) == 0) {
                        if (parseFloat(effect.value) == parseInt(effect.value)) {
                            this.validationError[index] = "";
                            this.validationResult[index] = parseInt(effect.value).toString();
                        } else {
                            this.validationError[index] = "This may result in a decimal value and be turned into a whole number."
                            this.validationResult[index] = parseInt(effect.value).toString();
                        }
                    } else {
                        this.validationError[index] = "This may result in an invalid value. Absolute effects with an invalid value will not be applied."
                        this.validationResult[index] = parseInt(effect.value).toString();
                    }
                } else {
                    this.validationError[index] = "This may result in an invalid value. Absolute effects with an invalid value will not be applied."
                    this.validationResult[index] = "";
                }
            }
        } else if (propertyData.validation == "1plus") {
            if (parseInt(value) >= 1) {

            } else {
                this.newEffect[propertyData.key] = 1
            }
        } else if (propertyData.validation == "0plus") {
            if (parseInt(value) >= 0) {

            } else {
                this.newEffect[propertyData.key] = 0
            }
        } else if (propertyData.validation == "=1plus") {
            if (parseInt(value) >= -1) {

            } else {
                this.newEffect[propertyData.key] = -1
            }
        } else if (propertyData.validation == "0minus") {
            if (parseInt(value) <= 0) {

            } else {
                this.newEffect[propertyData.key] = 0
            }
        }
    }

    get_CustomEffectProperties() {
        function get_PropertyData(key: string, effectsService: EffectsService) {
            return effectsService.get_EffectProperties().filter(property => property.key == key)[0];
        }
        return Object.keys(this.newEffect).map((key) => get_PropertyData(key, this.effectsService)).filter(property => property != undefined).sort((a, b) => {
            if (a.priority > b.priority) {
                return 1;
            }
            if (a.priority < b.priority) {
                return -1;
            }
            return 0;
        }).sort((a, b) => {
            if (a.group > b.group) {
                return 1;
            }
            if (a.group < b.group) {
                return -1;
            }
            return 0;
        });
    }

    get_Examples(propertyData: ItemProperty) {
        let examples: string[] = [""];

        switch (propertyData.examples) {
            case "effects affected":
                examples.push(...this.characterService.get_Skills(this.get_Character()).map((skill: Skill) => skill.name));
                examples.push(...this.characterService.get_Abilities().map((ability: Ability) => { return ability.name }));
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.effects.length).forEach(feat => {
                    examples.push(...feat.effects.map(effect => effect.affected))
                });
                this.characterService.get_Conditions().filter(condition => condition.effects.length).forEach((condition: Condition) => {
                    examples.push(...condition.effects.map(effect => effect.affected))
                });
                this.activitiesService.get_Activities().filter(activity => activity.effects.length).forEach((activity: Activity) => {
                    examples.push(...activity.effects.map(effect => effect.affected))
                });
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                    item.activities.filter(activity => activity.effects.length).forEach((activity: Activity) => {
                        examples.push(...activity.effects.map(effect => effect.affected))
                    });
                });
                break;
            case "effects value":
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.onceEffects.length).forEach(feat => {
                    examples.push(...feat.onceEffects.map(effect => effect.value))
                });
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.effects.length).forEach(feat => {
                    examples.push(...feat.effects.map(effect => effect.value))
                });
                this.characterService.get_Conditions().filter(condition => condition.onceEffects.length).forEach((condition: Condition) => {
                    examples.push(...condition.onceEffects.map(effect => effect.value))
                });
                this.characterService.get_Conditions().filter(condition => condition.effects.length).forEach((condition: Condition) => {
                    examples.push(...condition.effects.map(effect => effect.value))
                });
                this.activitiesService.get_Activities().filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                    examples.push(...activity.onceEffects.map(effect => effect.value))
                });
                this.activitiesService.get_Activities().filter(activity => activity.effects.length).forEach((activity: Activity) => {
                    examples.push(...activity.effects.map(effect => effect.value))
                });
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                    item.activities.filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                        examples.push(...activity.onceEffects.map(effect => effect.value))
                    });
                    item.activities.filter(activity => activity.effects.length).forEach((activity: Activity) => {
                        examples.push(...activity.effects.map(effect => effect.value))
                    });
                });
                this.get_Items().allConsumables().concat(...this.get_Inventories().map(inventory => inventory.allConsumables())).filter(item => item.onceEffects.length).forEach((item: Consumable) => {
                    examples.push(...item.onceEffects.map(effect => effect.value))
                });
                examples = examples.filter(example => typeof example == "string" && !example.toLowerCase().includes("object") && !example.toLowerCase().includes("heightened") && !example.toLowerCase().includes("value"));
                break;
            case "effects setvalue":
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.onceEffects.length).forEach(feat => {
                    examples.push(...feat.onceEffects.map(effect => effect.setValue))
                });
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.effects.length).forEach(feat => {
                    examples.push(...feat.effects.map(effect => effect.setValue))
                });
                this.characterService.get_Conditions().filter(condition => condition.onceEffects.length).forEach((condition: Condition) => {
                    examples.push(...condition.onceEffects.map(effect => effect.setValue))
                });
                this.characterService.get_Conditions().filter(condition => condition.effects.length).forEach((condition: Condition) => {
                    examples.push(...condition.effects.map(effect => effect.setValue))
                });
                this.activitiesService.get_Activities().filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                    examples.push(...activity.onceEffects.map(effect => effect.setValue))
                });
                this.activitiesService.get_Activities().filter(activity => activity.effects.length).forEach((activity: Activity) => {
                    examples.push(...activity.effects.map(effect => effect.setValue))
                });
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                    item.activities.filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                        examples.push(...activity.onceEffects.map(effect => effect.setValue))
                    });
                    item.activities.filter(activity => activity.effects.length).forEach((activity: Activity) => {
                        examples.push(...activity.effects.map(effect => effect.setValue))
                    });
                });
                this.get_Items().allConsumables().concat(...this.get_Inventories().map(inventory => inventory.allConsumables())).filter(item => item.onceEffects.length).forEach((item: Consumable) => {
                    examples.push(...item.onceEffects.map(effect => effect.setValue))
                });
                examples = examples.filter(example => typeof example == "string" && !example.toLowerCase().includes("object") && !example.toLowerCase().includes("heightened") && !example.toLowerCase().includes("value"));
                break;
            case "effects type":
                examples = ["", "item", "circumstance", "status", "proficiency"];
                break;
        }

        let uniqueExamples = Array.from(new Set(examples))
        return uniqueExamples
            .sort(function (a, b) {
                if (a > b) {
                    return 1;
                }
                if (a < b) {
                    return -1;
                }
                return 0;
            });;
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (["conditions", "all"].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == "character" && ["conditions", "all"].includes(view.target.toLowerCase())) {
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
