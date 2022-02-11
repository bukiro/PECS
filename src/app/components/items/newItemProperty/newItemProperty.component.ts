import { Component, Input } from '@angular/core';
import { ItemsService } from 'src/app/services/items.service';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { TraitsService } from 'src/app/services/traits.service';
import { ActivitiesService } from 'src/app/services/activities.service';
import { SpellsService } from 'src/app/services/spells.service';
import { EvaluationService } from 'src/app/services/evaluation.service';
import { Consumable } from 'src/app/classes/Consumable';
import { Equipment } from 'src/app/classes/Equipment';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ItemGain } from 'src/app/classes/ItemGain';
import { EffectGain } from 'src/app/classes/EffectGain';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Item } from 'src/app/classes/Item';
import { ItemProperty } from 'src/app/classes/ItemProperty';
import { SpellCast } from 'src/app/classes/SpellCast';
import { Activity } from 'src/app/classes/Activity';
import { Condition } from 'src/app/classes/Condition';
import { Skill } from 'src/app/classes/Skill';
import { Ability } from 'src/app/classes/Ability';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { InventoryGain } from 'src/app/classes/InventoryGain';
import { Hint } from 'src/app/classes/Hint';
import { SpellGain } from 'src/app/classes/SpellGain';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { RingOfWizardrySlot } from 'src/app/classes/WornItem';

@Component({
    selector: 'app-newItemProperty',
    templateUrl: './newItemProperty.component.html',
    styleUrls: ['./newItemProperty.component.css']
})
export class NewItemPropertyComponent {

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
        private spellsService: SpellsService,
        private evaluationService: EvaluationService
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
        this.validationError = "";
        this.validationResult = "";
        let value = this.get_Parent()[this.propertyKey];
        if (this.propertyKey == "name" && !this.propertyData.parent) {
            if (!value) {
                this.get_Parent()[this.propertyKey] = "New Item"
            }
            let existingItems = this.get_Inventories()[0][this.newItem.type].filter((existing: Item) => existing.name == value);
            let existingCleanItems = this.itemsService.get_CleanItems()[this.newItem.type].filter((existing: Item) => existing.name == value);
            if (existingItems.length && existingItems.some((existing: Item) => existing.can_Stack())) {
                this.validationError = "If you use this name, this item will be added to the " + existingItems[0].name + " stack in your inventory. All changes you make here will be lost.";
            } else if (existingItems.length) {
                this.validationError = "You already own an item with this name and type.";
            } else if (existingCleanItems.length) {
                this.validationError = "An item with this name and type already exists, but you don't own it.";
            }
        }
        if (this.propertyKey == "value" && this.propertyData.parent == "effects") {
            if (value && value != "0") {
                let validationResult = this.evaluationService.get_ValueFromFormula(value, { characterService: this.characterService, effectsService: this.effectsService }, { creature: this.get_Character() })?.toString() || "0";
                if (validationResult && validationResult != "0" && (parseInt(validationResult) || parseFloat(validationResult))) {
                    if (parseFloat(validationResult) == parseInt(validationResult)) {
                        this.validationError = "";
                        this.validationResult = parseInt(validationResult).toString();
                    } else {
                        this.validationError = "This may result in a decimal value and be turned into a whole number."
                        this.validationResult = parseInt(validationResult).toString();
                    }
                } else {
                    this.validationError = "This may result in an invalid value or 0. Invalid values will default to 0, and relative effects with value 0 will not be applied."
                    this.validationResult = parseInt(validationResult).toString();
                }
            }
        } else if (this.propertyKey == "setValue" && this.propertyData.parent == "effects") {
            if (value && value != "0") {
                let validationResult = this.evaluationService.get_ValueFromFormula(value, { characterService: this.characterService, effectsService: this.effectsService }, { creature: this.get_Character() })?.toString() || null;
                if (validationResult && validationResult != "0" && (parseInt(validationResult) || parseFloat(validationResult))) {
                    if (parseFloat(validationResult) == parseInt(validationResult)) {
                        this.validationError = "";
                        this.validationResult = parseInt(validationResult).toString();
                    } else {
                        this.validationError = "This may result in a decimal value and be turned into a whole number."
                        this.validationResult = parseInt(validationResult).toString();
                    }
                } else {
                    this.validationError = "This may result in an invalid value. Absolute effects with an invalid value will not be applied."
                    this.validationResult = parseInt(validationResult).toString();
                }
            }
        } else if (this.propertyKey == "value" && this.propertyData.parent == "onceEffects") {
            if (value && value != "0") {
                let validationResult = this.evaluationService.get_ValueFromFormula(value, { characterService: this.characterService, effectsService: this.effectsService }, { creature: this.get_Character() })?.toString() || "0";
                if (validationResult && validationResult != "0" && (parseInt(validationResult) || parseFloat(validationResult))) {
                    if (parseFloat(validationResult) == parseInt(validationResult)) {
                        this.validationError = "";
                        this.validationResult = parseInt(validationResult).toString();
                    } else {
                        this.validationError = "This may result in a decimal value and be turned into a whole number."
                        this.validationResult = parseInt(validationResult).toString();
                    }
                } else {
                    this.validationError = "This may result in an invalid value or 0. This is allowed for languages; for all other targets, invalid values will default to 0, and untyped effects without a value will not be displayed."
                    this.validationResult = parseInt(validationResult).toString();
                }
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
                this.get_Parent()[this.propertyKey][index - 1].source = this.get_Parent()["id"];
                break;
            case "gainActivities":
                index = this.get_Parent()[this.propertyKey].push(new ActivityGain())
                this.get_Parent()[this.propertyKey][index - 1].source = this.get_Parent()["id"];
                break;
            case "gainItems":
                this.get_Parent()[this.propertyKey].push(new ItemGain())
                break;
            case "castSpells":
                this.get_Parent()[this.propertyKey].push(new SpellCast())
                break;
            case "hints":
                this.get_Parent()[this.propertyKey].push(new Hint())
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
                index = this.get_Parent()[this.propertyKey].push(new SpellChoice())
                this.get_Parent()[this.propertyKey][index - 1].source = this.get_Parent()["id"];
                break;
            case "gainSpells":
                index = this.get_Parent()[this.propertyKey].push(new SpellChoice())
                this.get_Parent()[this.propertyKey][index - 1].source = this.get_Parent()["id"];
                break;
            case "spells":
                index = this.get_Parent()[this.propertyKey].push(new SpellGain())
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
            case "gainLanguages":
                this.get_Parent()[this.propertyKey].push(new LanguageGain())
                break;
            case "isRingOfWizardry":
                this.get_Parent()[this.propertyKey].push({ tradition: "", level: 1 } as RingOfWizardrySlot);
                break;
            case "gainSenses":
                this.get_Parent()[this.propertyKey].push("" as string)
                break;
        }
    }

    remove_NewItemObject(index: number) {
        this.get_Parent()[this.propertyKey].splice(index, 1);
    }

    get_NewItemSubProperties(object: object) {
        return Object.keys(object)
            .map((key) =>
                this.itemsService.get_ItemProperties().filter(property => property.parent == this.propertyData.key && property.key == key)[0]
            )
            .filter(property => property != undefined)
            .sort((a, b) => (a.group + a.priority == b.group + b.priority) ? 0 : ((a.group + a.priority > b.group + b.priority) ? 1 : -1));
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
                        examples = this.characterService.get_Skills(this.get_Character(), "", { type: "Weapon Proficiency" }).map(item => item.name)
                        examples.push("Advanced Weapons");
                        break;
                    case "armors":
                        examples = this.characterService.get_Skills(this.get_Character(), "", { type: "Armor Proficiency" }).map(item => item.name);
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
            case "weaponbase":
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
            case "istalismancord":
                examples = [0, 1, 2, 3];
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
                examples.push(...this.spellsService.get_Spells().map(spell => spell.name));
                break;
            case "spelllevels":
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
                    examples.push(...feat.onceEffects.map(effect => effect.affected))
                });
                this.characterService.get_Conditions().filter(condition => condition.onceEffects.length).forEach((condition: Condition) => {
                    examples.push(...condition.onceEffects.map(effect => effect.affected))
                });
                this.activitiesService.get_Activities().filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                    examples.push(...activity.onceEffects.map(effect => effect.affected))
                });
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                    item.activities.filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                        examples.push(...activity.onceEffects.map(effect => effect.affected))
                    });
                });
                this.get_Items().allConsumables().concat(...this.get_Inventories().map(inventory => inventory.allConsumables())).filter(item => item.onceEffects.length).forEach((item: Consumable) => {
                    examples.push(...item.onceEffects.map(effect => effect.affected))
                });
                break;
            case "onceEffects value":
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.onceEffects.length).forEach(feat => {
                    examples.push(...feat.onceEffects.map(effect => effect.value))
                });
                this.characterService.get_Conditions().filter(condition => condition.onceEffects.length).forEach((condition: Condition) => {
                    examples.push(...condition.onceEffects.map(effect => effect.value))
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
                break;
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
                this.characterService.get_FeatsAndFeatures().filter(feat => feat.hints.length).forEach(feat => {
                    examples.push(...feat.hints.filter(hint => hint.showon.length).map(hint => hint.showon));
                })
                this.characterService.get_Conditions().filter(condition => condition.hints.length).forEach(condition => {
                    examples.push(...condition.hints.filter(hint => hint.showon.length).map(hint => hint.showon));
                })
                this.activitiesService.get_Activities().filter(activity => activity.hints.length).forEach(activity => {
                    examples.push(...activity.hints.filter(hint => hint.showon.length).map(hint => hint.showon));
                })
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                    item.activities.filter(activity => activity.hints.length).forEach(activity => {
                        examples.push(...activity.hints.filter(hint => hint.showon.length).map(hint => hint.showon));
                    })
                });
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.hints.length).forEach((item: Equipment) => {
                    examples.push(...item.hints.filter(hint => hint.showon.length).map(hint => hint.showon));
                });
                break;
            case "hints desc":
                this.activitiesService.get_Activities().filter(activity => activity.hints.length).forEach(activity => {
                    examples.push(...activity.hints.filter(hint => hint.desc.length).map(hint => hint.desc));
                })
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).filter(item => item.activities.length).forEach((item: Equipment) => {
                    item.activities.filter(activity => activity.hints.length).forEach(activity => {
                        examples.push(...activity.hints.filter(hint => hint.desc.length).map(hint => hint.desc));
                    })
                });
                break;
            case "effects type":
                examples = ["", "item", "circumstance", "status", "proficiency"];
                break;
            case "gaincondition name":
                examples.push(...this.characterService.get_Conditions().map((condition: Condition) => condition.name));
                break;
            case "gaincondition alignmentfilter":
                examples.push("Chaotic", "Chaotic Evil", "Chaotic Good", "Evil", "Good", "Lawful", "Lawful Evil", "Lawful Good", "Neutral", "Neutral Evil", "Neutral Good", "!Chaotic", "!Chaotic Evil", "!Chaotic Good", "!Evil", "!Good", "!Lawful", "!Lawful Evil", "!Lawful Good", "!Neutral", "!Neutral Evil", "!Neutral Good");
                break;
            case "gainitems name":
                examples = this.itemsService.get_Items()[this.get_Parent()["type"]].map((item: Item) => item.name);
                break;
            case "gainitems on":
                examples = ["", "equip", "grant", "use"];
                break;
            case "gainitems expirationcondition":
                examples = ["", "equipped", "unequipped"];
                break;
            case "dicesize":
                examples = [1, 2, 3, 4, 6, 8, 10, 12];
                break;
            case "senses":
                examples = ["", "Low-Light Vision", "Darkvision", "Greater Darkvision", "Scent 30 feet (imprecise)", "Tremorsense 30 feet (imprecise)"]
            default:
                this.get_Items().allEquipment().concat(...this.get_Inventories().map(inventory => inventory.allEquipment())).forEach((item: Equipment) => {
                    extract_Example(item, this.propertyData.key, this.get_IsObject, this.propertyData.parent);
                });
                this.get_Items().allConsumables().concat(...this.get_Inventories().map(inventory => inventory.allConsumables())).forEach((item: Consumable) => {
                    extract_Example(item, this.propertyData.key, this.get_IsObject, this.propertyData.parent);
                });
                break;

        }

        let uniqueExamples = Array.from(new Set(examples.filter(example => example.toString().length <= 90)))
        return uniqueExamples.sort();
    }

    get_ItemSets() {
        return this.itemsService.get_Items().names;
    }

    set_ItemType() {
        this.get_Parent()["name"] = this.itemsService.get_Items()[this.get_Parent()["type"]][0]["name"];
    }

}