import { Component, OnInit, Input } from '@angular/core';
import { ItemsService } from 'src/app/items.service';
import { CharacterService } from 'src/app/character.service';
import { Consumable } from 'src/app/Consumable';
import { Equipment } from 'src/app/Equipment';
import { ItemActivity } from 'src/app/ItemActivity';
import { ActivityGain } from 'src/app/ActivityGain';
import { ItemGain } from 'src/app/ItemGain';
import { EffectGain } from 'src/app/EffectGain';
import { ConditionGain } from 'src/app/ConditionGain';
import { Item } from 'src/app/Item';
import { ItemProperty } from 'src/app/ItemProperty';
import { SpellCast } from 'src/app/SpellCast';
import { EffectsService } from 'src/app/effects.service';
import { typeWithParameters } from '@angular/compiler/src/render3/util';
import { TraitsService } from 'src/app/traits.service';
import { ActivitiesService } from 'src/app/activities.service';
import { SpellsService } from 'src/app/spells.service';
import { FeatsService } from 'src/app/feats.service';
import { Activity } from 'src/app/Activity';
import { Condition } from 'src/app/Condition';
import { Feat } from 'src/app/Feat';
import { Skill } from 'src/app/Skill';
import { Ability } from 'src/app/Ability';

@Component({
    selector: 'app-newItemProperty',
    templateUrl: './newItemProperty.component.html',
    styleUrls: ['./newItemProperty.component.css']
})
export class NewItemPropertyComponent implements OnInit {

    @Input()
    propertyKey: string;
    @Input()
    parents: string[] = [];
    @Input()
    newItem: Item;
    @Input()
    propertyData: ItemProperty;
    @Input()
    noTitle: boolean = false;

    public validationError: string = "";
    public validationResult: string = "";

    constructor(
        private itemsService: ItemsService,
        private characterService: CharacterService,
        private effectsService: EffectsService,
        private traitsService: TraitsService,
        private activitiesService: ActivitiesService,
        private spellsService: SpellsService
    ) { }

    get_Parent() {
        let item = this.newItem;
        this.parents.forEach(parent => {
            item = item[parent];
        })
        return item;
    }

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

    get_Items() {
        return this.itemsService.get_Items();
    }

    get_InventoryItems() {
        return this.characterService.get_InventoryItems();
    }

    validate() {
        let value = this.get_Parent()[this.propertyKey]
        if (this.propertyKey == "value" && (this.propertyData.parent == "effects" || this.propertyData.parent == "onceEffects")) {
            let effectGain = new EffectGain;
            effectGain.value = value;
            let effect = this.effectsService.get_SimpleEffects(this.characterService, { effects: [effectGain] })[0];
            if (effect && effect.value && effect.value != "0" && (parseInt(effect.value) || parseFloat(effect.value))) {
                if (parseFloat(effect.value) == parseInt(effect.value)) {
                    this.validationError = "";
                    this.validationResult = parseInt(effect.value).toString();
                } else {
                    this.validationError = "This may result in a decimal value and be turned into a whole number."
                    this.validationResult = parseInt(effect.value).toString();
                }
            } else {
                this.validationError = "This may result in an invalid value or 0. Invalid values will default to 0."
                this.validationResult = parseInt(effect.value).toString();
            }
        } else if (this.propertyKey == "bulk" || this.propertyKey == "carryingBulk") {
            if (parseInt(value) || parseInt(value) == 0 || value == "L" || value == "") {

            } else {
                this.get_Parent()[this.propertyKey] = ""
            }
        } else if (this.propertyData.validation == "1plus") {
            if (parseInt(value) >= 1) {

            } else {
                this.get_Parent()[this.propertyKey] = 1
            }
        } else if (this.propertyData.validation == "0plus") {
            if (parseInt(value) >= 0) {

            } else {
                this.get_Parent()[this.propertyKey] = 0
            }
        } else if (this.propertyData.validation == "=1plus") {
            if (parseInt(value) >= -1) {

            } else {
                this.get_Parent()[this.propertyKey] = -1
            }
        } else if (this.propertyData.validation == "0minus") {
            if (parseInt(value) <= 0) {

            } else {
                this.get_Parent()[this.propertyKey] = 0
            }
        }
    }

    get_IsObject(property) {
        return (typeof property == 'object');
    }

    add_NewItemObject() {
        switch (this.propertyKey) {
            case "activities":
                this.get_Parent()[this.propertyKey].push(new ItemActivity())
                break;
            case "gainActivity":
                this.get_Parent()[this.propertyKey].push(new ActivityGain())
                break;
            case "gainItems":
                this.get_Parent()[this.propertyKey].push(new ItemGain())
                break;
            case "castSpells":
                this.get_Parent()[this.propertyKey].push(new SpellCast())
                break;
            case "effects":
                this.get_Parent()[this.propertyKey].push(new EffectGain())
                break;
            case "onceEffects":
                this.get_Parent()[this.propertyKey].push(new EffectGain())
                break;
            case "propertyRunes":
                this.get_Parent()[this.propertyKey].push("" as string)
                break;
            case "traits":
                this.get_Parent()[this.propertyKey].push("" as string)
                break;
            case "gainCondition":
                this.get_Parent()[this.propertyKey].push(new ConditionGain())
                break;
            case "castSpells":
                this.get_Parent()[this.propertyKey].push("" as string)
                break;
        }
    }

    remove_NewItemObject(index: number) {
        this.get_Parent()[this.propertyKey].splice(index, 1);
    }

    get_NewItemSubProperties(object: object) {
        let hideProperties: string[] = [
            "active",
            "activeCooldown",
            "source"
        ]
        function get_PropertyData(key: string, itemsService: ItemsService, propertyData: ItemProperty) {
            return itemsService.get_ItemProperties().filter(property => property.parent == propertyData.key && property.key == key)[0];
        }
        return Object.keys(object).filter(key => hideProperties.indexOf(key) == -1).map((key) => get_PropertyData(key, this.itemsService, this.propertyData)).filter(property => property != undefined);
    }

    get_Examples() {
        let examples: (string | number)[] = [""];

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

        switch (this.propertyData.examples) {
            case "traits":
                examples = this.traitsService.get_Traits().map(trait => trait.name)
                break;
            case "activity":
                examples.push(...this.get_Items().allConsumables().concat(this.get_InventoryItems().allConsumables())
                    .filter(item => item[this.propertyData.key] && item[this.propertyData.key].length).map((item: Consumable) => {
                        return item[this.propertyData.key];
                    }));
                this.get_Items().allEquipment().concat(this.get_InventoryItems().allEquipment()).filter(item => item.activities.length).forEach((item: Equipment) => {
                    examples.push(...item.activities.filter(activity => activity[this.propertyData.key].length)
                        .map((activity: Activity) => { return activity[this.propertyData.key]; }
                        ))
                });
                examples.push(...this.activitiesService.get_Activities()
                    .filter(activity => activity[this.propertyData.key].length).map((activity: Activity) => {
                        return activity[this.propertyData.key];
                    }));
                break;
            case "spellname":
                examples.push(...this.spellsService.get_Spells().map(spell => { return spell.name }));
                break;
            case "spelllevel":
                examples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                break;
            case "onceEffects affected":
                examples.push(...["Focus", "HP", "Temporary HP"])
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.onceEffects.length).forEach(feat => {
                    examples.push(...feat.onceEffects.map(effect => { return effect.affected; }))
                });
                this.characterService.get_Conditions().filter(condition => condition.onceEffects.length).forEach((condition: Condition) => {
                    examples.push(...condition.onceEffects.map(effect => { return effect.affected; }))
                });
                this.activitiesService.get_Activities().filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                    examples.push(...activity.onceEffects.map(effect => { return effect.affected; }))
                });
                this.get_Items().allEquipment().concat(this.get_InventoryItems().allEquipment()).filter(item => item.activities.length).forEach((item: Equipment) => {
                    item.activities.filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                        examples.push(...activity.onceEffects.map(effect => { return effect.affected; }))
                    });
                });
                this.get_Items().allConsumables().concat(this.get_InventoryItems().allConsumables()).filter(item => item.onceEffects.length).forEach((item: Consumable) => {
                    examples.push(...item.onceEffects.map(effect => { return effect.affected; }))
                });
                break;
            case "effects affected":
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.effects.length).forEach(feat => {
                    examples.push(...feat.effects.map(effect => { return effect.affected; }))
                });
                this.characterService.get_Conditions().filter(condition => condition.effects.length).forEach((condition: Condition) => {
                    examples.push(...condition.effects.map(effect => { return effect.affected; }))
                });
                this.activitiesService.get_Activities().filter(activity => activity.effects.length).forEach((activity: Activity) => {
                    examples.push(...activity.effects.map(effect => { return effect.affected; }))
                });
                this.get_Items().allEquipment().concat(this.get_InventoryItems().allEquipment()).filter(item => item.activities.length).forEach((item: Equipment) => {
                    item.activities.filter(activity => activity.effects.length).forEach((activity: Activity) => {
                        examples.push(...activity.effects.map(effect => { return effect.affected; }))
                    });
                });
                break;
            case "effects value":
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.onceEffects.length).forEach(feat => {
                    examples.push(...feat.onceEffects.map(effect => { return effect.value; }))
                });
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.effects.length).forEach(feat => {
                    examples.push(...feat.effects.map(effect => { return effect.value; }))
                });
                this.characterService.get_Conditions().filter(condition => condition.onceEffects.length).forEach((condition: Condition) => {
                    examples.push(...condition.onceEffects.map(effect => { return effect.value; }))
                });
                this.characterService.get_Conditions().filter(condition => condition.effects.length).forEach((condition: Condition) => {
                    examples.push(...condition.effects.map(effect => { return effect.value; }))
                });
                this.activitiesService.get_Activities().filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                    examples.push(...activity.onceEffects.map(effect => { return effect.value; }))
                });
                this.activitiesService.get_Activities().filter(activity => activity.effects.length).forEach((activity: Activity) => {
                    examples.push(...activity.effects.map(effect => { return effect.value; }))
                });
                this.get_Items().allEquipment().concat(this.get_InventoryItems().allEquipment()).filter(item => item.activities.length).forEach((item: Equipment) => {
                    item.activities.filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                        examples.push(...activity.onceEffects.map(effect => { return effect.value; }))
                    });
                    item.activities.filter(activity => activity.effects.length).forEach((activity: Activity) => {
                        examples.push(...activity.effects.map(effect => { return effect.value; }))
                    });
                });
                this.get_Items().allConsumables().concat(this.get_InventoryItems().allConsumables()).filter(item => item.onceEffects.length).forEach((item: Consumable) => {
                    examples.push(...item.onceEffects.map(effect => { return effect.value; }))
                });
                break;
            case "inputRequired":
                this.get_Items().allEquipment().concat(this.get_InventoryItems().allEquipment()).filter(item => item.activities.length).forEach((item: Equipment) => {
                    examples.push(...item.activities.filter(activity => activity.inputRequired.length)
                        .map((activity: Activity) => { return activity.inputRequired; }
                        ))
                });
                examples.push(...this.activitiesService.get_Activities()
                    .filter(activity => activity.inputRequired.length).map((activity: Activity) => {
                        return activity.inputRequired;
                    }));
                examples.push(...this.characterService.get_Conditions()
                    .filter(condition => condition.inputRequired.length).map((condition: Condition) => {
                        return condition.inputRequired;
                    }));
                break;
            case "gainactivity name":
                examples.push(...this.activitiesService.get_Activities().map((activity: Activity) => {
                    return activity.name;
                }));
                break;
            case "showon":
                examples.push(...this.characterService.get_Skills().map((skill: Skill) => {return skill.name}));
                examples.push(...this.characterService.get_Abilities().map((ability: Ability) => {return ability.name}));
                examples.push(...this.characterService.get_FeatsAndFeatures().filter(feat => feat.showon.length).map((feat: Feat) => { return feat.showon }));
                examples.push(...this.characterService.get_Conditions().filter(condition => condition.showon.length).map((condition: Condition) => { return condition.showon }));
                examples.push(...this.activitiesService.get_Activities().filter(activity => activity.showon.length).map((activity: Activity) => { return activity.showon }));
                this.get_Items().allEquipment().concat(this.get_InventoryItems().allEquipment()).filter(item => item.activities.length).forEach((item: Equipment) => {
                    examples.push(...item.activities.filter(activity => activity.showon.length).map((activity: Activity) => { return activity.showon }));
                });
                examples.push(...this.get_Items().allEquipment().concat(this.get_InventoryItems().allEquipment()).filter(item => item.showon.length).map((item: Equipment) => { return item.showon }));
                break;
            case "effect type":
                examples = ["", "item", "circumstance", "status", "proficiency", "untyped"];
                break;
            case "gaincondition name":
                examples.push(...this.characterService.get_Conditions().map((condition: Condition) => {
                    return condition.name;
                }));
                break;
            case "gainitems name":
                if (this.get_Parent()["type"].length) {
                    examples.push(...this.itemsService.get_Items()[this.get_Parent()["type"]].map((item: Item) => {
                        return item.name;
                    }));
                    this.validationError = "";
                } else {
                    this.validationError = "You must pick an item type first.";
                    examples = [];
                }
                break;
            case "gainitems on":
                examples = ["", "equip", "grant"];
                break;
            case "dicesize":
                examples = [1, 2, 3, 4, 6, 8, 10, 12, 20, 100];
                break;
            default:
                this.get_Items().allEquipment().concat(this.get_InventoryItems().allEquipment()).forEach((item: Equipment) => {
                    extract_Example(item, this.propertyData.key, this.get_IsObject, this.propertyData.parent);
                });
                this.get_Items().allConsumables().concat(this.get_InventoryItems().allConsumables()).forEach((item: Consumable) => {
                    extract_Example(item, this.propertyData.key, this.get_IsObject, this.propertyData.parent);
                });
                break;
            
        }

        let uniqueExamples = Array.from(new Set(examples))
        return uniqueExamples;
    }

    get_ItemSets() {
        return this.itemsService.get_Items().names;
    }

    ngOnInit() {
    }

}
