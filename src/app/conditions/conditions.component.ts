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
import { EvaluationService } from '../evaluation.service';
import { CustomEffectsService } from '../customEffects.service';
import { RefreshService } from '../refresh.service';

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
    public showCreature: "Character" | "Companion" | "Familiar" = "Character";
    public wordFilter: string = "";
    public permanent: boolean = true;
    public untilRest: boolean = false;
    public untilRefocus: boolean = false;
    public days: number = 0;
    public hours: number = 0;
    public minutes: number = 0;
    public turns: number = 0;
    private purpose: "conditions" | "customeffects" = "conditions";
    public newEffect: EffectGain = new EffectGain();
    public validationError: string[] = [];
    public validationResult: string[] = [];
    public parseInt = parseInt;
    public range: number = 0;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private refreshService: RefreshService,
        private activitiesService: ActivitiesService,
        private conditionsService: ConditionsService,
        private effectsService: EffectsService,
        private itemsService: ItemsService,
        private timeService: TimeService,
        private traitsService: TraitsService,
        private evaluationService: EvaluationService,
        private customEffectsService: CustomEffectsService
    ) { }

    set_Range(amount: number) {
        this.range += amount;
    }

    toggle_List(type) {
        if (this.showList == type) {
            this.showList = "";
        } else {
            this.showList = type;
        }
        this.range = 0;
    }

    get_ShowList() {
        return this.showList;
    }

    toggle_Item(name) {
        if (this.showItem == name) {
            this.showItem = "";
        } else {
            this.showItem = name;
        }
    }

    get_ShowItem() {
        return this.showItem;
    }

    toggle_Purpose(purpose: "conditions" | "customeffects") {
        this.purpose = purpose;
    }

    get_ShowPurpose() {
        return this.purpose;
    }

    toggle_Creature(type) {
        this.showCreature = type;
    }

    get_ShowCreature() {
        return this.showCreature;
    }

    toggle_TileMode() {
        this.get_Character().settings.conditionsTileMode = !this.get_Character().settings.conditionsTileMode;
        this.refreshService.set_ToChange("Character", "conditions");
        this.refreshService.process_ToChange();
    }

    get_TileMode() {
        return this.get_Character().settings.conditionsTileMode;
    }

    validate_DurationNumbers() {
        this.hours = Math.max(0, Math.min(23, this.hours))
        this.minutes = Math.max(0, Math.min(59, this.minutes))
        this.turns = Math.max(0, Math.min(9, this.turns))
        this.set_NonPermanent();
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    trackByName(index: number, obj: any): any {
        return obj.name;
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
            case "Weapons":
                typeKey = "weapons";
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
                !condition.hide &&
                (
                    !this.wordFilter || (
                        this.wordFilter && (
                            condition.name.toLowerCase().includes(this.wordFilter.toLowerCase()) ||
                            condition.desc.toLowerCase().includes(this.wordFilter.toLowerCase())
                        )
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

    get_HeightenedDescription(condition: Condition) {
        if (this.heightened >= condition.minLevel) {
            return condition.get_Heightened(condition.desc, this.heightened);
        } else {
            return condition.get_Heightened(condition.desc, condition.minLevel);
        }
    }

    set_Permanent(duration: number) {
        this.permanent = duration == -1;
        this.untilRest = duration == -2;
        this.untilRefocus = duration == -3;
        this.days = 0;
        this.hours = 0;
        this.minutes = 0;
        this.turns = 0;
    }

    add_Day(days: number) {
        this.days = Math.max(this.days + days, 0);
        this.set_NonPermanent();
    }

    set_NonPermanent() {
        this.permanent = this.untilRest = this.untilRefocus = false;
    }

    get_ConditionDuration(includeTurn: boolean = true) {
        if (this.permanent) {
            return -1;
        }
        if (this.untilRest) {
            return -2;
        }
        if (this.untilRefocus) {
            return -3;
        }
        return (
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

    get_Duration(duration: number = this.get_ConditionDuration(), inASentence: boolean = false) {
        return this.timeService.get_Duration(duration, true, inASentence);
    }

    add_Condition(creature: Creature, condition: Condition, duration: number = this.get_ConditionDuration(false), includeTurnState: boolean = true) {
        let newGain = new ConditionGain();
        newGain.name = condition.name;
        if (duration < 0 || duration == 1 || !includeTurnState) {
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
        return this.customEffectsService.get_EffectProperties.find(property => !property.parent && property.key == "effects");
    }

    get_EffectValue(creature: Creature, effect: EffectGain) {
        //Send the effect's setValue or value to the EvaluationService to get its result.
        let result: any = null;
        let penalty: boolean = false;
        if (effect.setValue) {
            result = this.evaluationService.get_ValueFromFormula(effect.setValue, { characterService: this.characterService, effectsService: this.effectsService }, { creature: creature });
            penalty = false;
        } else if (effect.value) {
            result = this.evaluationService.get_ValueFromFormula(effect.value, { characterService: this.characterService, effectsService: this.effectsService }, { creature: creature });
            if (!isNaN(result)) {
                penalty = (result < 0) == (effect.affected != "Bulk");
            } else {
                result = null;
            }
        }
        return { value: result, penalty: penalty };
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

    get_IsFormula(value: string) {
        if (value && isNaN(parseInt(value))) {
            if (!value.match("^[0-9-]*$")) {
                return true;
            }
        }
        return false;
    }

    get_EffectInvalid() {
        if (!this.newEffect.affected || (!this.newEffect.toggle && !this.newEffect.setValue && this.newEffect.value == "0")) {
            return "This effect will not do anything."
        };
    }

    add_Effect(creature: Creature) {
        let duration: number = this.get_ConditionDuration(false);
        let newLength = creature.effects.push(Object.assign<EffectGain, EffectGain>(new EffectGain(), JSON.parse(JSON.stringify(this.newEffect))).recast());
        if (duration == -1) {
            creature.effects[newLength - 1].duration = duration;
        } else {
            creature.effects[newLength - 1].duration = duration + (this.endOn == this.timeService.get_YourTurn() ? 0 : 5);
        }
        creature.effects[newLength - 1].maxDuration = creature.effects[newLength - 1].duration;
        this.refreshService.set_ToChange(creature.type, "effects");
        this.refreshService.set_ToChange(creature.type, "conditions");
        this.refreshService.process_ToChange();
    }

    new_CustomEffect(creature: Creature) {
        creature.effects.push(new EffectGain());
    }

    remove_Effect(creature: Creature, effect: EffectGain) {
        creature.effects.splice(creature.effects.indexOf(effect), 1);
        this.refreshService.set_ToChange(creature.type, "effects");
        this.refreshService.set_ToChange(creature.type, "conditions");
        this.refreshService.process_ToChange();
    }

    update_Effects(creature: Creature) {
        this.refreshService.set_ToChange(creature.type, "effects");
        this.refreshService.set_ToChange(creature.type, "conditions");
        this.refreshService.process_ToChange();
    }

    validate(creature: Creature, effect: EffectGain) {
        if (this.get_IsFormula(effect.value)) {
            effect.value = "0";
        }
        this.update_Effects(creature);
    }

    validate_AdvancedEffect(propertyData: ItemProperty, index: number) {
        let value = this.newEffect[propertyData.key]
        if (propertyData.key == "value" && propertyData.parent == "effects") {
            if (value && value != "0") {
                let validationResult = this.evaluationService.get_ValueFromFormula(value, { characterService: this.characterService, effectsService: this.effectsService }, { creature: this.get_Character() }).toString();
                if (validationResult && validationResult != "0" && (parseInt(validationResult) || parseFloat(validationResult))) {
                    if (parseFloat(validationResult) == parseInt(validationResult)) {
                        this.validationError[index] = "";
                        this.validationResult[index] = parseInt(validationResult).toString();
                    } else {
                        this.validationError[index] = "This may result in a decimal value and be turned into a whole number."
                        this.validationResult[index] = parseInt(validationResult).toString();
                    }
                } else {
                    this.validationError[index] = "This may result in an invalid value or 0. Invalid values will default to 0, and untyped effects without a value will not be displayed."
                    this.validationResult[index] = parseInt(validationResult).toString();
                }
            }
        } else if (propertyData.key == "setValue" && propertyData.parent == "effects") {
            if (value && value != "0") {
                let validationResult = this.evaluationService.get_ValueFromFormula(value, { characterService: this.characterService, effectsService: this.effectsService }, { creature: this.get_Character() }).toString();
                if (validationResult && (parseInt(validationResult) || parseFloat(validationResult)) || parseInt(validationResult) == 0) {
                    if (parseFloat(validationResult) == parseInt(validationResult)) {
                        this.validationError[index] = "";
                        this.validationResult[index] = parseInt(validationResult).toString();
                    } else {
                        this.validationError[index] = "This may result in a decimal value and be turned into a whole number."
                        this.validationResult[index] = parseInt(validationResult).toString();
                    }
                } else {
                    this.validationError[index] = "This may result in an invalid value. Absolute effects with an invalid value will not be applied."
                    this.validationResult[index] = parseInt(validationResult).toString();
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
        let customEffectsService = this.customEffectsService;
        function get_PropertyData(key: string) {
            return customEffectsService.get_EffectProperties.find(property => property.key == key);
        }
        return Object.keys(this.newEffect).map((key) => get_PropertyData(key)).filter(property => property != undefined).sort((a, b) => {
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
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                    item.activities.filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                        examples.push(...activity.onceEffects.map(effect => effect.value))
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
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                    item.activities.filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                        examples.push(...activity.onceEffects.map(effect => effect.setValue))
                    });
                });
                this.get_Items().allConsumables().concat(...this.get_Inventories().map(inventory => inventory.allConsumables())).filter(item => item.onceEffects.length).forEach((item: Consumable) => {
                    examples.push(...item.onceEffects.map(effect => effect.setValue))
                });
                examples = examples.filter(example => typeof example == "string" && !example.toLowerCase().includes("object") && !example.toLowerCase().includes("heightened") && !example.toLowerCase().includes("value"));
                break;
            case "effects title":
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.effects.length).forEach(feat => {
                    examples.push(...feat.effects.map(effect => effect.title))
                });
                this.characterService.get_Conditions().filter(condition => condition.effects.length).forEach((condition: Condition) => {
                    examples.push(...condition.effects.map(effect => effect.title))
                });
                examples = examples.filter(example => typeof example == "string" && !example.toLowerCase().includes("object") && !example.toLowerCase().includes("heightened"));
                break;
            case "effects type":
                examples = this.get_BonusTypes();
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

    get_BonusTypes() {
        return this.effectsService.bonusTypes.map(type => type == "untyped" ? "" : type);
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.refreshService.get_Changed
                .subscribe((target) => {
                    if (["conditions", "all"].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.refreshService.get_ViewChanged
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
