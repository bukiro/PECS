import { Component, Input } from '@angular/core';
import { ItemsService } from 'src/app/services/items.service';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { TraitsService } from 'src/app/services/traits.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { SpellsService } from 'src/app/services/spells.service';
import { EvaluationService } from 'src/app/services/evaluation.service';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ItemGain } from 'src/app/classes/ItemGain';
import { EffectGain } from 'src/app/classes/EffectGain';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Item } from 'src/app/classes/Item';
import { ItemProperty } from 'src/app/classes/ItemProperty';
import { SpellCast } from 'src/app/classes/SpellCast';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { InventoryGain } from 'src/app/classes/InventoryGain';
import { Hint } from 'src/app/classes/Hint';
import { SpellGain } from 'src/app/classes/SpellGain';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { RingOfWizardrySlot } from 'src/app/classes/WornItem';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Equipment } from 'src/app/classes/Equipment';
import { Consumable } from 'src/app/classes/Consumable';

@Component({
    selector: 'app-newItemProperty',
    templateUrl: './newItemProperty.component.html',
    styleUrls: ['./newItemProperty.component.css'],
})
export class NewItemPropertyComponent {

    @Input()
    propertyKey: string;
    @Input()
    parents: Array<string> = [];
    @Input()
    newItem: Item;
    @Input()
    propertyData: ItemProperty;
    @Input()
    noTitle = false;

    public validationError = '';
    public validationResult = '';

    constructor(
        private readonly itemsService: ItemsService,
        private readonly characterService: CharacterService,
        private readonly effectsService: EffectsService,
        private readonly traitsService: TraitsService,
        private readonly activitiesService: ActivitiesDataService,
        private readonly spellsService: SpellsService,
        private readonly evaluationService: EvaluationService,
    ) { }

    get_Parent() {
        let item = this.newItem;

        this.parents.forEach(parent => {
            item = item[parent];
        });

        return item;
    }

    public trackByIndex(index: number): number {
        return index;
    }

    get_Items() {
        return this.itemsService.get_Items();
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    private get_Inventories(): Array<ItemCollection> {
        return this.get_Character().inventories;
    }

    validate() {
        this.validationError = '';
        this.validationResult = '';

        const value = this.get_Parent()[this.propertyKey];

        if (this.propertyKey == 'name' && !this.propertyData.parent) {
            if (!value) {
                this.get_Parent()[this.propertyKey] = 'New Item';
            }

            const existingItems = this.get_Inventories()[0][this.newItem.type].filter((existing: Item) => existing.name == value);
            const existingCleanItems = this.itemsService.get_CleanItems()[this.newItem.type].filter((existing: Item) => existing.name == value);

            if (existingItems.length && existingItems.some((existing: Item) => existing.canStack())) {
                this.validationError = `If you use this name, this item will be added to the ${ existingItems[0].name } stack in your inventory. All changes you make here will be lost.`;
            } else if (existingItems.length) {
                this.validationError = 'You already own an item with this name and type.';
            } else if (existingCleanItems.length) {
                this.validationError = 'An item with this name and type already exists, but you don\'t own it.';
            }
        }

        if (this.propertyKey == 'value' && this.propertyData.parent == 'effects') {
            if (value && value != '0') {
                const validationResult = this.evaluationService.get_ValueFromFormula(value, { characterService: this.characterService, effectsService: this.effectsService }, { creature: this.get_Character() })?.toString() || '0';

                if (validationResult && validationResult != '0' && (parseInt(validationResult, 10) || parseFloat(validationResult))) {
                    if (parseFloat(validationResult) == parseInt(validationResult, 10)) {
                        this.validationError = '';
                        this.validationResult = parseInt(validationResult, 10).toString();
                    } else {
                        this.validationError = 'This may result in a decimal value and be turned into a whole number.';
                        this.validationResult = parseInt(validationResult, 10).toString();
                    }
                } else {
                    this.validationError = 'This may result in an invalid value or 0. Invalid values will default to 0, and relative effects with value 0 will not be applied.';
                    this.validationResult = parseInt(validationResult, 10).toString();
                }
            }
        } else if (this.propertyKey == 'setValue' && this.propertyData.parent == 'effects') {
            if (value && value != '0') {
                const validationResult = this.evaluationService.get_ValueFromFormula(value, { characterService: this.characterService, effectsService: this.effectsService }, { creature: this.get_Character() })?.toString() || null;

                if (validationResult && validationResult != '0' && (parseInt(validationResult, 10) || parseFloat(validationResult, 10))) {
                    if (parseFloat(validationResult) == parseInt(validationResult, 10)) {
                        this.validationError = '';
                        this.validationResult = parseInt(validationResult, 10).toString();
                    } else {
                        this.validationError = 'This may result in a decimal value and be turned into a whole number.';
                        this.validationResult = parseInt(validationResult, 10).toString();
                    }
                } else {
                    this.validationError = 'This may result in an invalid value. Absolute effects with an invalid value will not be applied.';
                    this.validationResult = parseInt(validationResult, 10).toString();
                }
            }
        } else if (this.propertyKey == 'value' && this.propertyData.parent == 'onceEffects') {
            if (value && value != '0') {
                const validationResult = this.evaluationService.get_ValueFromFormula(value, { characterService: this.characterService, effectsService: this.effectsService }, { creature: this.get_Character() })?.toString() || '0';

                if (validationResult && validationResult != '0' && (parseInt(validationResult) || parseFloat(validationResult))) {
                    if (parseFloat(validationResult) == parseInt(validationResult)) {
                        this.validationError = '';
                        this.validationResult = parseInt(validationResult, 10).toString();
                    } else {
                        this.validationError = 'This may result in a decimal value and be turned into a whole number.';
                        this.validationResult = parseInt(validationResult, 10).toString();
                    }
                } else {
                    this.validationError = 'This may result in an invalid value or 0. This is allowed for languages; for all other targets, invalid values will default to 0, and untyped effects without a value will not be displayed.';
                    this.validationResult = parseInt(validationResult, 10).toString();
                }
            }
        } else if (this.propertyKey == 'bulk' || this.propertyKey == 'carryingBulk') {
            if (parseInt(value, 10) || parseInt(value, 10) == 0 || value == 'L' || value == '') {
                //Do nothing if the validation is successful.
            } else {
                this.get_Parent()[this.propertyKey] = '';
            }
        } else if (this.propertyData.validation == '1plus') {
            if (parseInt(value, 10) >= 1) {
                //Do nothing if the validation is successful.
            } else {
                this.get_Parent()[this.propertyKey] = 1;
            }
        } else if (this.propertyData.validation == '0plus') {
            if (parseInt(value, 10) >= 0) {
                //Do nothing if the validation is successful.
            } else {
                this.get_Parent()[this.propertyKey] = 0;
            }
        } else if (this.propertyData.validation == '=1plus') {
            if (parseInt(value, 10) >= -1) {
                //Do nothing if the validation is successful.
            } else {
                this.get_Parent()[this.propertyKey] = -1;
            }
        } else if (this.propertyData.validation == '0minus') {
            if (parseInt(value, 10) <= 0) {
                //Do nothing if the validation is successful.
            } else {
                this.get_Parent()[this.propertyKey] = 0;
            }
        }
    }

    get_IsObject(property) {
        return (typeof property === 'object');
    }

    add_NewItemObject() {
        let index = null;

        switch (this.propertyKey) {
            case 'activities':
                index = this.get_Parent()[this.propertyKey].push(new ItemActivity());
                this.get_Parent()[this.propertyKey][index - 1].source = this.get_Parent().id;
                break;
            case 'gainActivities':
                index = this.get_Parent()[this.propertyKey].push(new ActivityGain());
                this.get_Parent()[this.propertyKey][index - 1].source = this.get_Parent().id;
                break;
            case 'gainItems':
                this.get_Parent()[this.propertyKey].push(new ItemGain());
                break;
            case 'castSpells':
                this.get_Parent()[this.propertyKey].push(new SpellCast());
                break;
            case 'hints':
                this.get_Parent()[this.propertyKey].push(new Hint());
                break;
            case 'effects':
                this.get_Parent()[this.propertyKey].push(new EffectGain());
                break;
            case 'onceEffects':
                this.get_Parent()[this.propertyKey].push(new EffectGain());
                break;
            case 'propertyRunes':
                this.get_Parent()[this.propertyKey].push('' as string);
                break;
            case 'storedSpells':
                index = this.get_Parent()[this.propertyKey].push(new SpellChoice());
                this.get_Parent()[this.propertyKey][index - 1].source = this.get_Parent().id;
                break;
            case 'gainSpells':
                index = this.get_Parent()[this.propertyKey].push(new SpellChoice());
                this.get_Parent()[this.propertyKey][index - 1].source = this.get_Parent().id;
                break;
            case 'spells':
                index = this.get_Parent()[this.propertyKey].push(new SpellGain());
                break;
            case 'traits':
                this.get_Parent()[this.propertyKey].push('' as string);
                break;
            case 'gainConditions':
                this.get_Parent()[this.propertyKey].push(new ConditionGain());
                break;
            case 'gainInventory':
                this.get_Parent()[this.propertyKey].push(new InventoryGain());
                break;
            case 'gainLanguages':
                this.get_Parent()[this.propertyKey].push(new LanguageGain());
                break;
            case 'isRingOfWizardry':
                this.get_Parent()[this.propertyKey].push({ tradition: '', level: 1 } as RingOfWizardrySlot);
                break;
            case 'gainSenses':
                this.get_Parent()[this.propertyKey].push('' as string);
                break;
            case 'choices':
                this.get_Parent()[this.propertyKey].push('' as string);
                break;
        }
    }

    remove_NewItemObject(index: number) {
        this.get_Parent()[this.propertyKey].splice(index, 1);
    }

    get_NewItemSubProperties(object: object) {
        return Object.keys(object)
            .map(key =>
                this.itemsService.get_ItemProperties().filter(property => property.parent == this.propertyData.key && property.key == key)[0],
            )
            .filter(property => property != undefined)
            .sort((a, b) => (a.group + a.priority == b.group + b.priority) ? 0 : ((a.group + a.priority > b.group + b.priority) ? 1 : -1));
    }

    get_Examples() {
        let examples: Array<string | number> = [''];

        const get_AllItems = () => this.get_Items().allItems()
            .concat(...this.get_Inventories().map(inventory => inventory.allItems()));

        const get_AllEquipment = () => this.get_Items().allEquipment()
            .concat(...this.get_Inventories().map(inventory => inventory.allEquipment()));

        const get_AllConsumables = () => this.get_Items().allConsumables()
            .concat(...this.get_Inventories().map(inventory => inventory.allConsumables()));

        const extract_Example = (element: Equipment | Consumable) => {
            const key = this.propertyData.key;
            const parent = this.propertyData.parent;

            if (parent) {
                if (element[parent]) {
                    element[parent].forEach(parent => {
                        if (parent[key]) {
                            if (!this.get_IsObject(parent[key])) {
                                examples.push(parent[key]);
                            } else {
                                examples.push(...parent[key]);
                            }
                        }
                    });
                }
            } else if (element[key]) {
                if (!this.get_IsObject(element[key])) {
                    examples.push(element[key]);
                } else {
                    examples.push(...element[key]);
                }
            }
        };

        switch (this.propertyData.examples) {
            case 'prof':
                switch (this.get_Parent().type) {
                    case 'weapons':
                        examples = this.characterService.get_Skills(this.get_Character(), '', { type: 'Weapon Proficiency' }).map(item => item.name);
                        examples.push('Advanced Weapons');
                        break;
                    case 'armors':
                        examples = this.characterService.get_Skills(this.get_Character(), '', { type: 'Armor Proficiency' }).map(item => item.name);
                        examples.push('Light Barding');
                        examples.push('Heavy Barding');
                        break;
                }

                break;
            case 'group':
                switch (this.get_Parent().type) {
                    case 'weapons':
                        examples.push(...this.get_Items().weapons.map(item => item.group));
                        break;
                    case 'armors':
                        examples.push(...this.get_Items().armors.map(item => item.group));
                        break;
                }

                break;
            case 'weaponbase':
                examples.push(...this.get_Items().weapons.map(item => item.weaponBase));
                break;
            case 'traits':
                examples = this.traitsService.getTraits().map(trait => trait.name);
                break;
            case 'isdoublingrings':
                examples = ['', 'Doubling Rings', 'Doubling Rings (Greater)'];
                break;
            case 'iswayfinder':
                examples = [0, 1, 2];
                break;
            case 'istalismancord':
                examples = [0, 1, 2, 3];
                break;
            case 'activity':
                examples.push(...get_AllConsumables()
                    .filter(item => item[this.propertyData.key] && item[this.propertyData.key].length)
                    .map(item => item[this.propertyData.key]));
                get_AllEquipment()
                    .filter(item => item.activities.length)
                    .forEach(item => {
                        examples.push(...item.activities.filter(activity => activity[this.propertyData.key].length)
                            .map(activity => activity[this.propertyData.key],
                        ));
                    });
                examples.push(...this.activitiesService.activities()
                    .filter(activity => activity[this.propertyData.key].length)
                    .map(activity =>
                        activity[this.propertyData.key],
                    ));
                break;
            case 'spellname':
                examples.push(...this.spellsService.get_Spells().map(spell => spell.name));
                break;
            case 'spelllevels':
                examples = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
                break;
            case 'spelltraditions':
                examples = ['', 'Arcane', 'Divine', 'Occult', 'Primal'];
                break;
            case 'spelltargets':
                examples = ['', 'Enemies', 'Others', 'Caster'];
                break;
            case 'onceEffects affected':
                examples.push(...['Focus', 'HP', 'Temporary HP']);
                this.characterService.get_FeatsAndFeatures()
                    .filter(feat => feat.onceEffects.length)
                    .forEach(feat => {
                        examples.push(...feat.onceEffects.map(effect => effect.affected));
                    });
                this.characterService.get_Conditions()
                    .filter(condition => condition.onceEffects.length)
                    .forEach(condition => {
                        examples.push(...condition.onceEffects.map(effect => effect.affected));
                    });
                this.activitiesService.activities()
                    .filter(activity => activity.onceEffects.length)
                    .forEach(activity => {
                        examples.push(...activity.onceEffects.map(effect => effect.affected));
                    });
                get_AllEquipment()
                    .filter(item => item.activities.length)
                    .forEach(item => {
                        item.activities
                            .filter(activity => activity.onceEffects.length)
                            .forEach(activity => {
                                examples.push(...activity.onceEffects.map(effect => effect.affected));
                            });
                    });
                get_AllConsumables()
                    .filter(item => item.onceEffects.length)
                    .forEach(item => {
                        examples.push(...item.onceEffects.map(effect => effect.affected));
                    });
                break;
            case 'onceEffects value':
                this.characterService.get_FeatsAndFeatures()
                    .filter(feat => feat.onceEffects.length)
                    .forEach(feat => {
                        examples.push(...feat.onceEffects.map(effect => effect.value));
                    });
                this.characterService.get_Conditions()
                    .filter(condition => condition.onceEffects.length)
                    .forEach(condition => {
                        examples.push(...condition.onceEffects.map(effect => effect.value));
                    });
                this.activitiesService.activities()
                    .filter(activity => activity.onceEffects.length)
                    .forEach(activity => {
                        examples.push(...activity.onceEffects.map(effect => effect.value));
                    });
                get_AllEquipment()
                    .filter(item => item.activities.length)
                    .forEach(item => {
                        item.activities
                            .filter(activity => activity.onceEffects.length)
                            .forEach(activity => {
                                examples.push(...activity.onceEffects.map(effect => effect.value));
                            });
                    });
                get_AllConsumables()
                    .filter(item => item.onceEffects.length)
                    .forEach(item => {
                        examples.push(...item.onceEffects.map(effect => effect.value));
                    });
                break;
            case 'effects affected':
                examples.push(...this.characterService.get_Skills(this.get_Character()).map(skill => skill.name));
                examples.push(...this.characterService.get_Abilities().map(ability => ability.name));
                this.characterService.get_FeatsAndFeatures()
                    .filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.affected));
                    });
                this.characterService.get_Conditions()
                    .filter(condition => condition.effects.length)
                    .forEach(condition => {
                        examples.push(...condition.effects.map(effect => effect.affected));
                    });
                break;
            case 'effects value':
                this.characterService.get_FeatsAndFeatures()
                    .filter(feat => feat.onceEffects.length)
                    .forEach(feat => {
                        examples.push(...feat.onceEffects.map(effect => effect.value));
                    });
                this.characterService.get_FeatsAndFeatures()
                    .filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.value));
                    });
                this.characterService.get_Conditions()
                    .filter(condition => condition.onceEffects.length)
                    .forEach(condition => {
                        examples.push(...condition.onceEffects.map(effect => effect.value));
                    });
                this.characterService.get_Conditions()
                    .filter(condition => condition.effects.length)
                    .forEach(condition => {
                        examples.push(...condition.effects.map(effect => effect.value));
                    });
                this.activitiesService.activities()
                    .filter(activity => activity.onceEffects.length)
                    .forEach(activity => {
                        examples.push(...activity.onceEffects.map(effect => effect.value));
                    });
                get_AllEquipment()
                    .filter(item => item.activities.length)
                    .forEach(item => {
                        item.activities
                            .filter(activity => activity.onceEffects.length)
                            .forEach(activity => {
                                examples.push(...activity.onceEffects.map(effect => effect.value));
                            });
                    });
                get_AllConsumables()
                    .filter(item => item.onceEffects.length)
                    .forEach(item => {
                        examples.push(...item.onceEffects.map(effect => effect.value));
                    });
                examples = examples.filter(example => typeof example === 'string' && !example.toLowerCase().includes('object') && !example.toLowerCase().includes('heightened') && !example.toLowerCase().includes('value'));
                break;
            case 'effects setvalue':
                this.characterService.get_FeatsAndFeatures()
                    .filter(feat => feat.onceEffects.length)
                    .forEach(feat => {
                        examples.push(...feat.onceEffects.map(effect => effect.setValue));
                    });
                this.characterService.get_FeatsAndFeatures()
                    .filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.setValue));
                    });
                this.characterService.get_Conditions()
                    .filter(condition => condition.onceEffects.length)
                    .forEach(condition => {
                        examples.push(...condition.onceEffects.map(effect => effect.setValue));
                    });
                this.characterService.get_Conditions()
                    .filter(condition => condition.effects.length)
                    .forEach(condition => {
                        examples.push(...condition.effects.map(effect => effect.setValue));
                    });
                this.activitiesService.activities()
                    .filter(activity => activity.onceEffects.length)
                    .forEach(activity => {
                        examples.push(...activity.onceEffects.map(effect => effect.setValue));
                    });
                get_AllEquipment()
                    .filter(item => item.activities.length)
                    .forEach(item => {
                        item.activities
                            .filter(activity => activity.onceEffects.length)
                            .forEach(activity => {
                                examples.push(...activity.onceEffects.map(effect => effect.setValue));
                            });
                    });
                get_AllConsumables()
                    .filter(item => item.onceEffects.length)
                    .forEach(item => {
                        examples.push(...item.onceEffects.map(effect => effect.setValue));
                    });
                examples = examples
                    .filter(example =>
                        typeof example === 'string' &&
                        !example.toLowerCase().includes('object') &&
                        !example.toLowerCase().includes('heightened') &&
                        !example.toLowerCase().includes('value'),
                    );
                break;
            case 'effects title':
                this.characterService.get_FeatsAndFeatures()
                    .filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.title));
                    });
                this.characterService.get_Conditions()
                    .filter(condition => condition.effects.length)
                    .forEach(condition => {
                        examples.push(...condition.effects.map(effect => effect.title));
                    });
                examples = examples
                    .filter(example =>
                        typeof example === 'string' &&
                        !example.toLowerCase().includes('object') &&
                        !example.toLowerCase().includes('heightened'),
                    );
                break;
            case 'inputRequired':
                get_AllEquipment()
                    .filter(item => item.activities.length)
                    .forEach(item => {
                        examples.push(...item.activities
                            .filter(activity => activity.inputRequired.length)
                            .map(activity => activity.inputRequired),
                        );
                    });
                examples.push(...this.activitiesService.activities()
                    .filter(activity => activity.inputRequired.length)
                    .map(activity => activity.inputRequired));
                examples.push(...this.characterService.get_Conditions()
                    .filter(condition => condition.inputRequired.length)
                    .map(condition => condition.inputRequired));
                break;
            case 'gainactivity name':
                examples.push(...this.activitiesService.activities().map(activity => activity.name));
                break;
            case 'showon':
                examples.push(...this.characterService.get_Skills(this.get_Character()).map(skill => skill.name));
                examples.push(...this.characterService.get_Abilities().map(ability => ability.name));
                this.characterService.get_FeatsAndFeatures()
                    .filter(feat => feat.hints.length)
                    .forEach(feat => {
                        examples.push(...feat.hints.filter(hint => hint.showon.length).map(hint => hint.showon));
                    });
                this.characterService.get_Conditions()
                    .filter(condition => condition.hints.length)
                    .forEach(condition => {
                        examples.push(...condition.hints.filter(hint => hint.showon.length).map(hint => hint.showon));
                    });
                this.activitiesService.activities()
                    .filter(activity => activity.hints.length)
                    .forEach(activity => {
                        examples.push(...activity.hints.filter(hint => hint.showon.length).map(hint => hint.showon));
                    });
                get_AllEquipment()
                    .filter(item => item.activities.length)
                    .forEach(item => {
                        item.activities
                            .filter(activity => activity.hints.length)
                            .forEach(activity => {
                                examples.push(...activity.hints.filter(hint => hint.showon.length).map(hint => hint.showon));
                            });
                    });
                get_AllEquipment()
                    .filter(item => item.hints.length)
                    .forEach(item => {
                        examples.push(...item.hints.filter(hint => hint.showon.length).map(hint => hint.showon));
                    });
                break;
            case 'hints desc':
                this.activitiesService.activities().filter(activity => activity.hints.length)
                    .forEach(activity => {
                        examples.push(...activity.hints.filter(hint => hint.desc.length).map(hint => hint.desc));
                    });
                get_AllEquipment()
                    .filter(item => item.activities.length)
                    .forEach(item => {
                        item.activities
                            .filter(activity => activity.hints.length)
                            .forEach(activity => {
                                examples.push(...activity.hints.filter(hint => hint.desc.length).map(hint => hint.desc));
                            });
                    });
                break;
            case 'choices':
                get_AllEquipment()
                    .filter(item => item.choices.length)
                    .forEach(item => {
                        examples.push(...item.choices);
                    });
                break;
            case 'icontitleoverride':
                get_AllItems()
                    .filter(item => item.iconTitleOverride)
                    .forEach(item => {
                        examples.push(item.iconTitleOverride);
                    });
                break;
            case 'iconvalueoverride':
                get_AllItems()
                    .filter(item => item.iconTitleOverride)
                    .forEach(item => {
                        examples.push(item.iconValueOverride);
                    });
                break;
            case 'effects type':
                examples = ['', 'item', 'circumstance', 'status', 'proficiency'];
                break;
            case 'gaincondition name':
                examples.push(...this.characterService.get_Conditions().map(condition => condition.name));
                break;
            case 'gaincondition alignmentfilter':
                examples.push('Chaotic', 'Chaotic Evil', 'Chaotic Good', 'Evil', 'Good', 'Lawful', 'Lawful Evil', 'Lawful Good', 'Neutral', 'Neutral Evil', 'Neutral Good', '!Chaotic', '!Chaotic Evil', '!Chaotic Good', '!Evil', '!Good', '!Lawful', '!Lawful Evil', '!Lawful Good', '!Neutral', '!Neutral Evil', '!Neutral Good');
                break;
            case 'gainitems name':
                examples = this.itemsService.get_Items()[this.get_Parent().type].map((item: Item) => item.name);
                break;
            case 'gainitems on':
                examples = ['', 'equip', 'grant', 'use'];
                break;
            case 'gainitems expirationcondition':
                examples = ['', 'equipped', 'unequipped'];
                break;
            case 'dicesize':
                examples = [1, 2, 3, 4, 6, 8, 10, 12];
                break;
            case 'senses':
                examples = ['', 'Low-Light Vision', 'Darkvision', 'Greater Darkvision', 'Scent 30 feet (imprecise)', 'Tremorsense 30 feet (imprecise)'];
                break;
            default:
                get_AllEquipment()
                    .forEach(item => {
                        extract_Example(item);
                    });
                get_AllConsumables()
                    .forEach(item => {
                        extract_Example(item);
                    });
                break;

        }

        const uniqueExamples = Array.from(new Set(examples.filter(example => example.toString().length <= 90)));

        return uniqueExamples.sort();
    }

    get_ItemSets() {
        return this.itemsService.get_Items().names;
    }

    set_ItemType() {
        this.get_Parent().name = this.itemsService.get_Items()[this.get_Parent().type][0].name;
    }

}
