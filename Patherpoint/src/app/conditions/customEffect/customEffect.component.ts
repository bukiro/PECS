import { Component, OnInit, Input } from '@angular/core';
import { Creature } from 'src/app/Creature';
import { ItemProperty } from 'src/app/ItemProperty';
import { ItemsService } from 'src/app/items.service';
import { CharacterService } from 'src/app/character.service';
import { EffectsService } from 'src/app/effects.service';
import { ActivitiesService } from 'src/app/activities.service';
import { EffectGain } from 'src/app/EffectGain';
import { Condition } from 'src/app/Condition';
import { Activity } from 'src/app/Activity';
import { Skill } from 'src/app/Skill';
import { Ability } from 'src/app/Ability';
import { Equipment } from 'src/app/Equipment';
import { Consumable } from 'src/app/Consumable';
import { TimeService } from 'src/app/time.service';
import { stringify } from 'querystring';

@Component({
    selector: 'app-customEffect',
    templateUrl: './customEffect.component.html',
    styleUrls: ['./customEffect.component.css']
})
export class CustomEffectComponent implements OnInit {

    @Input()
    creature: Creature;
    @Input()
    duration: number;
    @Input()
    noTitle: boolean = false;
    public newEffect: EffectGain = new EffectGain();

    public validationError: string = "";
    public validationResult: string = "";

    constructor(
        private itemsService: ItemsService,
        private characterService: CharacterService,
        private effectsService: EffectsService,
        private activitiesService: ActivitiesService,
        private timeService: TimeService
    ) { }

    numbersOnly(event): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode != 45 && charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    get_Duration(duration: number = this.duration) {
        return this.timeService.get_Duration(duration, false);
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    get_Items() {
        return this.itemsService.get_Items();
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Inventories() {
        return this.get_Character().inventories;
    }

    validate(propertyData: ItemProperty, propertyKey: string) {
        let value = this.newEffect[propertyKey]
        if (propertyKey == "value" && propertyData.parent == "effects") {
            if (value && value != "0") {
                let effectGain = new EffectGain;
                effectGain.value = value;
                let effects = this.effectsService.get_SimpleEffects(this.get_Character(), this.characterService, { effects: [effectGain] });
                if (effects.length) {
                    let effect = effects[0];
                    if (effect && effect.value && effect.value != "0" && (parseInt(effect.value) || parseFloat(effect.value))) {
                        if (parseFloat(effect.value) == parseInt(effect.value)) {
                            this.validationError = "";
                            this.validationResult = parseInt(effect.value).toString();
                        } else {
                            this.validationError = "This may result in a decimal value and be turned into a whole number."
                            this.validationResult = parseInt(effect.value).toString();
                        }
                    } else {
                        this.validationError = "This may result in an invalid value or 0. Invalid values will default to 0, and untyped effects without a value will not be displayed."
                        this.validationResult = parseInt(effect.value).toString();
                    }
                } else {
                    this.validationError = "This may result in an invalid value or 0. Invalid values will default to 0, and untyped effects without a value will not be displayed."
                    this.validationResult = "";
                }
            }
        } else if (propertyKey == "setValue" && propertyData.parent == "effects") {
            if (value && value != "0") {
                let effectGain = new EffectGain;
                effectGain.value = value;
                let effects = this.effectsService.get_SimpleEffects(this.get_Character(), this.characterService, { effects: [effectGain] });
                if (effects.length) {
                    let effect = effects[0];
                    if (effect && effect.value && (parseInt(effect.value) || parseFloat(effect.value)) || parseInt(effect.value) == 0) {
                        if (parseFloat(effect.value) == parseInt(effect.value)) {
                            this.validationError = "";
                            this.validationResult = parseInt(effect.value).toString();
                        } else {
                            this.validationError = "This may result in a decimal value and be turned into a whole number."
                            this.validationResult = parseInt(effect.value).toString();
                        }
                    } else {
                        this.validationError = "This may result in an invalid value. Absolute effects with an invalid value will not be applied."
                        this.validationResult = parseInt(effect.value).toString();
                    }
                } else {
                    this.validationError = "This may result in an invalid value. Absolute effects with an invalid value will not be applied."
                    this.validationResult = "";
                }
            }
        } else if (propertyData.validation == "1plus") {
            if (parseInt(value) >= 1) {

            } else {
                this.newEffect[propertyKey] = 1
            }
        } else if (propertyData.validation == "0plus") {
            if (parseInt(value) >= 0) {

            } else {
                this.newEffect[propertyKey] = 0
            }
        } else if (propertyData.validation == "=1plus") {
            if (parseInt(value) >= -1) {

            } else {
                this.newEffect[propertyKey] = -1
            }
        } else if (propertyData.validation == "0minus") {
            if (parseInt(value) <= 0) {

            } else {
                this.newEffect[propertyKey] = 0
            }
        }
    }

    get_IsObject(property) {
        return (typeof property == 'object');
    }

    add_NewItemObject() {
        let newLength = this.creature.effects.push(this.newEffect)
        this.creature.effects[newLength - 1].duration = this.duration;
        this.characterService.set_ToChange(this.creature.type, "effects");
        this.characterService.process_ToChange();
    }

    remove_NewItemObject(index: number) {
        this.creature.effects.splice(index, 1);
        this.characterService.set_ToChange(this.creature.type, "effects");
        this.characterService.process_ToChange();
    }

    get_PropertyKeys() {
        return Object.keys(this.newEffect);
    }

    get_PropertyData(key: string) {
        //Return an array of one ItemProperty
        return this.effectsService.get_EffectProperties().filter(property => property.key == key);
    }

    get_Examples(propertyData: ItemProperty) {
        let examples: string[] = [""];

        function extract_Example(element, key: string, isObject: Function, parent: string = "") {
            if (parent) {
                if (element[parent]) {
                    element[parent].forEach(parent => {
                        if (parent[key]) {
                            if (!isObject(parent[key])) {
                                examples.push(parent[key]);
                            } else {
                                examples.push(...parent[key]);
                            }
                        }
                    });
                }
            } else if (element[key]) {
                if (!isObject(element[key])) {
                    examples.push(element[key]);
                } else {
                    examples.push(...element[key]);
                }
            }
        }

        switch (propertyData.examples) {
            case "effects affected":
                examples.push(...this.characterService.get_Skills(this.get_Character()).map((skill: Skill) =>  skill.name ));
                examples.push(...this.characterService.get_Abilities().map((ability: Ability) => {return ability.name}));
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.effects.length).forEach(feat => {
                    examples.push(...feat.effects.map(effect => effect.affected ))
                });
                this.characterService.get_Conditions().filter(condition => condition.effects.length).forEach((condition: Condition) => {
                    examples.push(...condition.effects.map(effect => effect.affected ))
                });
                this.activitiesService.get_Activities().filter(activity => activity.effects.length).forEach((activity: Activity) => {
                    examples.push(...activity.effects.map(effect => effect.affected ))
                });
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                    item.activities.filter(activity => activity.effects.length).forEach((activity: Activity) => {
                        examples.push(...activity.effects.map(effect => effect.affected ))
                    });
                });
                break;
            case "effects value":
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.onceEffects.length).forEach(feat => {
                    examples.push(...feat.onceEffects.map(effect => effect.value ))
                });
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.effects.length).forEach(feat => {
                    examples.push(...feat.effects.map(effect => effect.value ))
                });
                this.characterService.get_Conditions().filter(condition => condition.onceEffects.length).forEach((condition: Condition) => {
                    examples.push(...condition.onceEffects.map(effect => effect.value ))
                });
                this.characterService.get_Conditions().filter(condition => condition.effects.length).forEach((condition: Condition) => {
                    examples.push(...condition.effects.map(effect => effect.value ))
                });
                this.activitiesService.get_Activities().filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                    examples.push(...activity.onceEffects.map(effect => effect.value ))
                });
                this.activitiesService.get_Activities().filter(activity => activity.effects.length).forEach((activity: Activity) => {
                    examples.push(...activity.effects.map(effect => effect.value ))
                });
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                    item.activities.filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                        examples.push(...activity.onceEffects.map(effect => effect.value ))
                    });
                    item.activities.filter(activity => activity.effects.length).forEach((activity: Activity) => {
                        examples.push(...activity.effects.map(effect => effect.value ))
                    });
                });
                this.get_Items().allConsumables().concat(...this.get_Inventories().map(inventory => inventory.allConsumables())).filter(item => item.onceEffects.length).forEach((item: Consumable) => {
                    examples.push(...item.onceEffects.map(effect => effect.value ))
                });
                examples = examples.filter(example => typeof example == "string" && !example.toLowerCase().includes("object") && !example.toLowerCase().includes("heightened") && !example.toLowerCase().includes("value"));
                break;
            case "effects setvalue":
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.onceEffects.length).forEach(feat => {
                    examples.push(...feat.onceEffects.map(effect => effect.setValue ))
                });
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.effects.length).forEach(feat => {
                    examples.push(...feat.effects.map(effect => effect.setValue ))
                });
                this.characterService.get_Conditions().filter(condition => condition.onceEffects.length).forEach((condition: Condition) => {
                    examples.push(...condition.onceEffects.map(effect => effect.setValue ))
                });
                this.characterService.get_Conditions().filter(condition => condition.effects.length).forEach((condition: Condition) => {
                    examples.push(...condition.effects.map(effect => effect.setValue ))
                });
                this.activitiesService.get_Activities().filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                    examples.push(...activity.onceEffects.map(effect => effect.setValue ))
                });
                this.activitiesService.get_Activities().filter(activity => activity.effects.length).forEach((activity: Activity) => {
                    examples.push(...activity.effects.map(effect => effect.setValue ))
                });
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                    item.activities.filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                        examples.push(...activity.onceEffects.map(effect => effect.setValue ))
                    });
                    item.activities.filter(activity => activity.effects.length).forEach((activity: Activity) => {
                        examples.push(...activity.effects.map(effect => effect.setValue ))
                    });
                });
                this.get_Items().allConsumables().concat(...this.get_Inventories().map(inventory => inventory.allConsumables())).filter(item => item.onceEffects.length).forEach((item: Consumable) => {
                    examples.push(...item.onceEffects.map(effect => effect.setValue ))
                });
                examples = examples.filter(example => typeof example == "string" && !example.toLowerCase().includes("object") && !example.toLowerCase().includes("heightened") && !example.toLowerCase().includes("value"));
                break;
            case "effects type":
                examples = ["", "item", "circumstance", "status", "proficiency"];
                break;
        }

        let uniqueExamples = Array.from(new Set(examples))
        return uniqueExamples;
    }

    update_Effects() {
        this.characterService.set_ToChange(this.creature.type, "effects");
        this.characterService.process_ToChange();
    }

    ngOnInit() {
    }

}
