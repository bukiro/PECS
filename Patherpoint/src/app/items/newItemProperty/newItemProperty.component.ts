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
import { TraitsService } from 'src/app/traits.service';
import { ActivitiesService } from 'src/app/activities.service';
import { SpellsService } from 'src/app/spells.service';
import { Activity } from 'src/app/Activity';
import { Condition } from 'src/app/Condition';
import { Feat } from 'src/app/Feat';
import { Skill } from 'src/app/Skill';
import { Ability } from 'src/app/Ability';
import { SpellChoice } from 'src/app/SpellChoice';
import { InventoryGain } from 'src/app/InventoryGain';

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

    validate() {
        let value = this.get_Parent()[this.propertyKey]
        if (this.propertyKey == "name" && !this.propertyData.parent) {
            if (!value) {
                this.get_Parent()[this.propertyKey] = "New Item"
            }
            let existingItems = this.get_Inventories()[0][this.newItem.type].filter((existing: Item) => existing.name == value && existing.can_Stack());
            if (existingItems.length) {
                this.validationError = "If you use this name, this item will be added to the "+existingItems[0].name+" stack in your inventory. All changes you make here will be lost.";
            } else {
                this.validationError = "";
            }
        }
        if (this.propertyKey == "value" && this.propertyData.parent == "effects") {
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
        } else if (this.propertyKey == "setValue" && this.propertyData.parent == "effects") {
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
        } else if (this.propertyKey == "value" && this.propertyData.parent == "onceEffects") {
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
                        this.validationError = "This may result in an invalid value or 0. This is allowed for languages; for all other targets, invalid values will default to 0, and untyped effects without a value will not be displayed."
                        this.validationResult = parseInt(effect.value).toString();
                    }
                } else {
                    this.validationError = "This may result in an invalid value or 0. This is allowed for languages; for all other targets, invalid values will default to 0, and untyped effects without a value will not be displayed."
                    this.validationResult = "";
                }
            }
        } else if (this.propertyKey == "moddable") {
            if (this.newItem["potencyRune"]) {
                this.newItem["potencyRune"] = 0;
            }
            if (this.newItem["strikingRune"]) {
                this.newItem["strikingRune"] = 0;
            }
            if (this.newItem["propertyRunes"]) {
                this.newItem["propertyRunes"].length = 0;
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
        let index = null;
        switch (this.propertyKey) {
            case "activities":
                index = this.get_Parent()[this.propertyKey].push(new ItemActivity())
                this.get_Parent()[this.propertyKey][index-1].source = this.get_Parent()["id"];
                break;
            case "gainActivities":
                index = this.get_Parent()[this.propertyKey].push(new ActivityGain())
                this.get_Parent()[this.propertyKey][index-1].source = this.get_Parent()["id"];
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
            case "storedSpells":
                this.get_Parent()[this.propertyKey].push(new SpellChoice())
                this.get_Parent()[this.propertyKey][index-1].source = this.get_Parent()["id"];
                break;
            case "traits":
                this.get_Parent()[this.propertyKey].push("" as string)
                break;
            case "gainConditions":
                this.get_Parent()[this.propertyKey].push(new ConditionGain())
                break;
            case "castSpells":
                this.get_Parent()[this.propertyKey].push("" as string)
                break;
            case "gainInventory":
                this.get_Parent()[this.propertyKey].push(new InventoryGain())
                break;
        }
    }

    remove_NewItemObject(index: number) {
        this.get_Parent()[this.propertyKey].splice(index, 1);
    }

    get_NewItemSubProperties(object: object) {
        return Object.keys(object).map((key) => 
            this.itemsService.get_ItemProperties().filter(property => property.parent == this.propertyData.key && property.key == key)[0])
                .filter(property => property != undefined)
                .sort((a,b) => {
                        if (a.priority > b.priority) {
                            return 1;
                        }
                        if (a.priority < b.priority) {
                            return -1;
                        }
                        return 0;
                    }).sort((a,b) => {
                        if (a.group > b.group) {
                            return 1;
                        }
                        if (a.group < b.group) {
                            return -1;
                        }
                        return 0;
                    });
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
            case "prof":
                switch (this.get_Parent()["type"]) {
                    case "weapons":
                        examples = this.characterService.get_Skills(this.get_Character(), "", "Weapon Proficiency").map(item => item.name)
                        examples.push("Advanced Weapons");
                        break;
                    case "armors":
                        examples = this.characterService.get_Skills(this.get_Character(), "", "Armor Proficiency").map(item => item.name);
                        examples.push("Light Barding");
                        examples.push("Heavy Barding");
                        break;
                }
                break;
            case "group":
                switch (this.get_Parent()["type"]) {
                    case "weapons":
                        examples.push(...this.get_Items().weapons.map(item => item.group))
                        break;
                    case "armors":
                        examples.push(...this.get_Items().armors.map(item => item.group))
                        break;
                }
                break;
            case "weaponBase":
                examples.push(...this.get_Items().weapons.map(item => item.weaponBase))
                break;
            case "traits":
                examples = this.traitsService.get_Traits().map(trait => trait.name)
                break;
            case "isdoublingrings":
                examples = ["", "Doubling Rings", "Doubling Rings (Greater)"];
                break;
            case "iswayfinder":
                examples = [0, 1, 2];
                break;
            case "activity":
                examples.push(...this.get_Items().allConsumables().concat(...this.get_Inventories().map(inventory => inventory.allConsumables()))
                    .filter(item => item[this.propertyData.key] && item[this.propertyData.key].length).map((item: Consumable) => {
                        return item[this.propertyData.key];
                    }));
                    this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                    examples.push(...item.activities.filter(activity => activity[this.propertyData.key].length)
                        .map((activity: Activity) => activity[this.propertyData.key]
                        ))
                });
                examples.push(...this.activitiesService.get_Activities()
                    .filter(activity => activity[this.propertyData.key].length).map((activity: Activity) => 
                        activity[this.propertyData.key]
                    ));
                break;
            case "spellname":
                examples.push(...this.spellsService.get_Spells().map(spell => spell.name ));
                break;
            case "spelllevel":
                examples = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                break;
            case "storedspelllevel":
                examples = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                break;
            case "spelltraditions":
                examples = ["", "Arcane", "Divine", "Occult", "Primal"];
                break;
            case "spelltargets":
                examples = ["", "Enemies", "Others", "Caster"];
                break;
            case "onceEffects affected":
                examples.push(...["Focus", "HP", "Temporary HP"])
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.onceEffects.length).forEach(feat => {
                    examples.push(...feat.onceEffects.map(effect => effect.affected ))
                });
                this.characterService.get_Conditions().filter(condition => condition.onceEffects.length).forEach((condition: Condition) => {
                    examples.push(...condition.onceEffects.map(effect => effect.affected ))
                });
                this.activitiesService.get_Activities().filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                    examples.push(...activity.onceEffects.map(effect => effect.affected ))
                });
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                    item.activities.filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                        examples.push(...activity.onceEffects.map(effect => effect.affected ))
                    });
                });
                this.get_Items().allConsumables().concat(...this.get_Inventories().map(inventory => inventory.allConsumables())).filter(item => item.onceEffects.length).forEach((item: Consumable) => {
                    examples.push(...item.onceEffects.map(effect => effect.affected ))
                });
                break;
            case "onceEffects value":
                    this.characterService.get_FeatsAndFeatures().filter(feat => feat.onceEffects.length).forEach(feat => {
                        examples.push(...feat.onceEffects.map(effect => effect.value ))
                    });
                    this.characterService.get_Conditions().filter(condition => condition.onceEffects.length).forEach((condition: Condition) => {
                        examples.push(...condition.onceEffects.map(effect => effect.value ))
                    });
                    this.activitiesService.get_Activities().filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                        examples.push(...activity.onceEffects.map(effect => effect.value ))
                    });
                    this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                        item.activities.filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                            examples.push(...activity.onceEffects.map(effect => effect.value ))
                        });
                    });
                    this.get_Items().allConsumables().concat(...this.get_Inventories().map(inventory => inventory.allConsumables())).filter(item => item.onceEffects.length).forEach((item: Consumable) => {
                        examples.push(...item.onceEffects.map(effect => effect.value ))
                    });
                    break;
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
            case "inputRequired":
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                    examples.push(...item.activities.filter(activity => activity.inputRequired.length)
                        .map((activity: Activity) => activity.inputRequired 
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
                examples.push(...this.characterService.get_Skills(this.get_Character()).map((skill: Skill) => skill.name));
                examples.push(...this.characterService.get_Abilities().map((ability: Ability) => ability.name));
                examples.push(...this.characterService.get_FeatsAndFeatures().filter(feat => feat.showon.length).map((feat: Feat) => feat.showon));
                examples.push(...this.characterService.get_Conditions().filter(condition => condition.showon.length).map((condition: Condition) => condition.showon));
                examples.push(...this.activitiesService.get_Activities().filter(activity => activity.showon.length).map((activity: Activity) => activity.showon));
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                    examples.push(...item.activities.filter(activity => activity.showon.length).map((activity: Activity) => activity.showon));
                });
                examples.push(...this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.showon.length).map((item: Equipment) => item.showon ));
                break;
            case "effects type":
                examples = ["", "item", "circumstance", "status", "proficiency"];
                break;
            case "gaincondition name":
                examples.push(...this.characterService.get_Conditions().map((condition: Condition) => condition.name ));
                break;
            case "gainitems name":
                examples = this.itemsService.get_Items()[this.get_Parent()["type"]].map((item: Item) => item.name );    
                break;
            case "gainitems on":
                examples = ["", "equip", "grant", "use"];
                break;
            case "dicesize":
                examples = [1, 2, 3, 4, 6, 8, 10, 12];
                break;
            default:
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).forEach((item: Equipment) => {
                    extract_Example(item, this.propertyData.key, this.get_IsObject, this.propertyData.parent);
                });
                this.get_Items().allConsumables().concat(...this.get_Inventories().map(inventory => inventory.allConsumables())).forEach((item: Consumable) => {
                    extract_Example(item, this.propertyData.key, this.get_IsObject, this.propertyData.parent);
                });
                break;
            
        }

        let uniqueExamples = Array.from(new Set(examples))
        return uniqueExamples.sort((a,b) => {
            if (a > b) {
                return 1;
            }
            if (a < b) {
                return -1;
            }
            return 0;
        });
    }

    get_ItemSets() {
        return this.itemsService.get_Items().names;
    }

    set_ItemType() {
        this.get_Parent()["name"] = this.itemsService.get_Items()[this.get_Parent()["type"]][0]["name"];
    }

    ngOnInit() {
    }

}
