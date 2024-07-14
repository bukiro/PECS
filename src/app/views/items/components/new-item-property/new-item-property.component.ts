/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Activity } from 'src/app/classes/activities/activity';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { ItemActivity } from 'src/app/classes/activities/item-activity';
import { SpellChoice } from 'src/app/classes/character-creation/spell-choice';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Character } from 'src/app/classes/creatures/character/character';
import { LanguageGain } from 'src/app/classes/creatures/character/language-gain';
import { EffectGain } from 'src/app/classes/effects/effect-gain';
import { Hint } from 'src/app/classes/hints/hint';
import { ItemPropertyConfiguration } from 'src/app/classes/item-creation/item-property-configuration';
import { Consumable } from 'src/app/classes/items/consumable';
import { Equipment } from 'src/app/classes/items/equipment';
import { InventoryGain } from 'src/app/classes/items/inventory-gain';
import { Item } from 'src/app/classes/items/item';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { ItemGain } from 'src/app/classes/items/item-gain';
import { RingOfWizardrySlot } from 'src/app/classes/items/worn-item';
import { SpellCast } from 'src/app/classes/spells/spell-cast';
import { SpellGain } from 'src/app/classes/spells/spell-gain';
import { DiceSizes } from 'src/libs/shared/definitions/diceSizes';
import { SpellLevels } from 'src/libs/shared/definitions/spellLevels';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { AbilitiesDataService } from 'src/libs/shared/services/data/abilities-data.service';
import { ActivitiesDataService } from 'src/libs/shared/services/data/activities-data.service';
import { ConditionsDataService } from 'src/libs/shared/services/data/conditions-data.service';
import { FeatsDataService } from 'src/libs/shared/services/data/feats-data.service';
import { ItemPropertiesDataService } from 'src/libs/shared/services/data/item-properties-data.service';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { SkillsDataService } from 'src/libs/shared/services/data/skills-data.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { EvaluationService } from 'src/libs/shared/services/evaluation/evaluation.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { ObjectPropertyAccessor } from 'src/libs/shared/util/object-property-accessor';
import { sortAlphaNum } from 'src/libs/shared/util/sortUtils';

//TODO: Rework this entire thing to make it work with strict mode and have fewer exceptions;

@Component({
    selector: 'app-new-item-property',
    templateUrl: './new-item-property.component.html',
    styleUrls: ['./new-item-property.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewItemPropertyComponent<T extends Item | object> extends TrackByMixin(BaseClass) {

    @Input()
    public propertyKey!: keyof T;
    @Input()
    public parents: Array<string | keyof T> = [];
    @Input()
    public newItem!: Item;
    @Input()
    public propertyData!: ItemPropertyConfiguration<any>;
    @Input()
    public noTitle = false;

    public validationError = '';
    public validationResult = '';

    constructor(
        private readonly _itemsDataService: ItemsDataService,
        private readonly _itemPropertiesDataService: ItemPropertiesDataService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _evaluationService: EvaluationService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _abilitiesDataService: AbilitiesDataService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _featsDataService: FeatsDataService,
    ) {
        super();
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public indexToKey(index: number): keyof T {
        return index as keyof T;
    }

    public parent(): T {
        let item = this.newItem;

        this.parents.forEach(parent => {
            item = item[parent];
        });

        return item;
    }

    public objectPropertyAccessor(object: T, key: keyof T): ObjectPropertyAccessor<T> {
        return new ObjectPropertyAccessor(object, key);
    }

    // eslint-disable-next-line complexity
    public validate(): void {
        this.validationError = '';
        this.validationResult = '';

        const value = this.parent()[this.propertyKey];

        if (this.propertyKey === 'name' && !this.propertyData.parent) {
            if (!value) {
                this.parent()[this.propertyKey] = 'New Item';
            }

            const existingItems = this._inventories()[0][this.newItem.type].filter((existing: Item) => existing.name === value);
            const existingCleanItems =
                this._itemsDataService.cleanItems()[this.newItem.type].filter((existing: Item) => existing.name === value);

            if (existingItems.length && existingItems.some((existing: Item) => existing.canStack())) {
                this.validationError =
                    `If you use this name, this item will be added to the ${ existingItems[0].name } `
                    + 'stack in your inventory. All changes you make here will be lost.';
            } else if (existingItems.length) {
                this.validationError = 'You already own an item with this name and type.';
            } else if (existingCleanItems.length) {
                this.validationError = 'An item with this name and type already exists, but you don\'t own it.';
            }
        }

        if (this.propertyKey === 'value' && this.propertyData.parent === 'effects') {
            if (value && value !== '0') {
                const validationResult =
                    this._evaluationService.valueFromFormula$(
                        value,
                        { creature: this._character },
                    )?.toString() || '0';

                if (validationResult && validationResult !== '0' && (parseInt(validationResult, 10) || parseFloat(validationResult))) {
                    if (parseFloat(validationResult) === parseInt(validationResult, 10)) {
                        this.validationError = '';
                        this.validationResult = parseInt(validationResult, 10).toString();
                    } else {
                        this.validationError = 'This may result in a decimal value and be turned into a whole number.';
                        this.validationResult = parseInt(validationResult, 10).toString();
                    }
                } else {
                    this.validationError =
                        'This may result in an invalid value or 0. '
                        + 'Invalid values will default to 0, and relative effects with value 0 will not be applied.';
                    this.validationResult = parseInt(validationResult, 10).toString();
                }
            }
        } else if (this.propertyKey === 'setValue' && this.propertyData.parent === 'effects') {
            if (value && value !== '0') {
                const validationResult =
                    this._evaluationService.valueFromFormula$(
                        value,
                        { creature: this._character },
                    )?.toString() || null;

                if (validationResult && validationResult !== '0' && (parseInt(validationResult, 10) || parseFloat(validationResult))) {
                    if (parseFloat(validationResult) === parseInt(validationResult, 10)) {
                        this.validationError = '';
                        this.validationResult = parseInt(validationResult, 10).toString();
                    } else {
                        this.validationError = 'This may result in a decimal value and be turned into a whole number.';
                        this.validationResult = parseInt(validationResult, 10).toString();
                    }
                } else {
                    this.validationError =
                        'This may result in an invalid value. Absolute effects with an invalid value will not be applied.';
                    this.validationResult = parseInt(validationResult, 10).toString();
                }
            }
        } else if (this.propertyKey === 'value' && this.propertyData.parent === 'onceEffects') {
            if (value && value !== '0') {
                const validationResult =
                    this._evaluationService.valueFromFormula$(
                        value,
                        { creature: this._character },
                    )?.toString() || '0';

                if (validationResult && validationResult !== '0' && (parseInt(validationResult, 10) || parseFloat(validationResult))) {
                    if (parseFloat(validationResult) === parseInt(validationResult, 10)) {
                        this.validationError = '';
                        this.validationResult = parseInt(validationResult, 10).toString();
                    } else {
                        this.validationError = 'This may result in a decimal value and be turned into a whole number.';
                        this.validationResult = parseInt(validationResult, 10).toString();
                    }
                } else {
                    this.validationError =
                        'This may result in an invalid value or 0. This is allowed for languages; for all other targets, '
                        + 'invalid values will default to 0, and untyped effects without a value will not be displayed.';
                    this.validationResult = parseInt(validationResult, 10).toString();
                }
            }
        } else if (this.propertyKey === 'bulk' || this.propertyKey === 'carryingBulk') {
            if (parseInt(value, 10) || parseInt(value, 10) === 0 || value === 'L' || value === '') {
                //Do nothing if the validation is successful.
            } else {
                this.parent()[this.propertyKey] = '';
            }
        } else if (this.propertyData.validation === '1plus') {
            if (parseInt(value, 10) >= 1) {
                //Do nothing if the validation is successful.
            } else {
                this.parent()[this.propertyKey] = 1;
            }
        } else if (this.propertyData.validation === '0plus') {
            if (parseInt(value, 10) >= 0) {
                //Do nothing if the validation is successful.
            } else {
                this.parent()[this.propertyKey] = 0;
            }
        } else if (this.propertyData.validation === '=1plus') {
            if (parseInt(value, 10) >= -1) {
                //Do nothing if the validation is successful.
            } else {
                this.parent()[this.propertyKey] = -1;
            }
        } else if (this.propertyData.validation === '0minus') {
            if (parseInt(value, 10) <= 0) {
                //Do nothing if the validation is successful.
            } else {
                this.parent()[this.propertyKey] = 0;
            }
        }
    }

    public isPropertyAnArray(property: any): property is Array<object | string | number> {
        return (typeof property === 'object');
    }

    public isPropertyAnObject(property: any): property is object {
        return (typeof property === 'object');
    }

    public addNewItemObject(): void {
        let index = null;

        switch (this.propertyKey) {
            case 'activities':
                index = this.parent()[this.propertyKey].push(new ItemActivity());
                this.parent()[this.propertyKey][index - 1].source = this.parent().id;
                break;
            case 'gainActivities':
                index = this.parent()[this.propertyKey].push(new ActivityGain(new Activity()));
                this.parent()[this.propertyKey][index - 1].source = this.parent().id;
                break;
            case 'gainItems':
                this.parent()[this.propertyKey].push(new ItemGain());
                break;
            case 'castSpells':
                this.parent()[this.propertyKey].push(new SpellCast());
                break;
            case 'hints':
                this.parent()[this.propertyKey].push(new Hint());
                break;
            case 'effects':
                this.parent()[this.propertyKey].push(new EffectGain());
                break;
            case 'onceEffects':
                this.parent()[this.propertyKey].push(new EffectGain());
                break;
            case 'propertyRunes':
                this.parent()[this.propertyKey].push('' as string);
                break;
            case 'storedSpells':
                index = this.parent()[this.propertyKey].push(new SpellChoice());
                this.parent()[this.propertyKey][index - 1].source = this.parent().id;
                break;
            case 'gainSpells':
                index = this.parent()[this.propertyKey].push(new SpellChoice());
                this.parent()[this.propertyKey][index - 1].source = this.parent().id;
                break;
            case 'spells':
                index = this.parent()[this.propertyKey].push(new SpellGain());
                break;
            case 'traits':
                this.parent()[this.propertyKey].push('' as string);
                break;
            case 'gainConditions':
                this.parent()[this.propertyKey].push(new ConditionGain());
                break;
            case 'gainInventory':
                this.parent()[this.propertyKey].push(new InventoryGain());
                break;
            case 'gainLanguages':
                this.parent()[this.propertyKey].push(new LanguageGain());
                break;
            case 'isRingOfWizardry':
                this.parent()[this.propertyKey].push({ tradition: '', level: 1 } as RingOfWizardrySlot);
                break;
            case 'gainSenses':
                this.parent()[this.propertyKey].push('' as string);
                break;
            case 'choices':
                this.parent()[this.propertyKey].push('' as string);
                break;
            default: break;
        }
    }

    public removeNewItemObject(index: number): void {
        this.parent()[this.propertyKey].splice(index, 1);
    }

    public subProperties(object: object): Array<ItemPropertyConfiguration<T>> {
        return Object.keys(object)
            .map(key =>
                this._itemPropertiesDataService.itemProperties()
                    .find(property => property.parent === this.propertyData.key && property.key === key),
            )
            .filter((property): property is ItemPropertyConfiguration<any> => property !== undefined)
            .sort((a, b) => sortAlphaNum(a.group + a.priority, b.group + b.priority));
    }

    // eslint-disable-next-line complexity
    public examples(): Array<string | number> {
        let examples: Array<string | number> = [''];
        const parent = this.parent();

        const allItems = (): Array<Item> => this._cleanItems().allItems()
            .concat(...this._inventories().map(inventory => inventory.allItems()));

        const allEquipment = (): Array<Equipment> => this._cleanItems().allEquipment()
            .concat(...this._inventories().map(inventory => inventory.allEquipment()));

        const allConsumables = (): Array<Consumable> => this._cleanItems().allConsumables()
            .concat(...this._inventories().map(inventory => inventory.allConsumables()));

        const extractExampleFromElement = (element: Equipment | Consumable): void => {
            const key = this.propertyData.key;
            const parentKey = this.propertyData.parent;

            if (parentKey) {
                if (element[parentKey]) {
                    element[parentKey].forEach((parentValue: Item) => {
                        if (parentValue[key]) {
                            if (!this.isPropertyAnObject(parentValue[key])) {
                                examples.push(parentValue[key]);
                            } else {
                                examples.push(...parentValue[key]);
                            }
                        }
                    });
                }
            } else if (element[key]) {
                if (!this.isPropertyAnObject(element[key])) {
                    examples.push(element[key]);
                } else {
                    examples.push(...element[key]);
                }
            }
        };

        const wayfinderOptionsLength = 3;
        const talismancordOptionsLength = 4;

        const character = this._character;

        switch (this.propertyData.examples) {
            case 'prof':
                switch (parent.type) {
                    case 'weapons':
                        examples =
                            this._skillsDataService
                                .skills(this._character.customSkills, '', { type: 'Weapon Proficiency' }).map(item => item.name);
                        examples.push('Advanced Weapons');
                        break;
                    case 'armors':
                        examples =
                            this._skillsDataService
                                .skills(this._character.customSkills, '', { type: 'Armor Proficiency' }).map(item => item.name);
                        examples.push('Light Barding');
                        examples.push('Heavy Barding');
                        break;
                    default: break;
                }

                break;
            case 'group':
                switch (parent.type) {
                    case 'weapons':
                        examples.push(...this._cleanItems().weapons.map(item => item.group));
                        break;
                    case 'armors':
                        examples.push(...this._cleanItems().armors.map(item => item.group));
                        break;
                    default: break;
                }

                break;
            case 'weaponbase':
                examples.push(...this._cleanItems().weapons.map(item => item.weaponBase));
                break;
            case 'traits':
                examples = this._traitsDataService.traits().map(trait => trait.name);
                break;
            case 'isdoublingrings':
                examples = ['', 'Doubling Rings', 'Doubling Rings (Greater)'];
                break;
            case 'iswayfinder':
                examples = [...Array(wayfinderOptionsLength).keys()];
                break;
            case 'istalismancord':
                examples = [...Array(talismancordOptionsLength).keys()];
                break;
            case 'activity':
                examples.push(...allConsumables()
                    .filter(item => item[this.propertyData.key] && item[this.propertyData.key].length)
                    .map(item => item[this.propertyData.key]));
                allEquipment()
                    .filter(item => item.activities.length)
                    .forEach(item => {
                        examples.push(
                            ...item.activities.filter(activity => activity[this.propertyData.key].length)
                                .map(activity => activity[this.propertyData.key]),
                        );
                    });
                examples.push(...this._activitiesDataService.activities()
                    .filter(activity => activity[this.propertyData.key].length)
                    .map(activity =>
                        activity[this.propertyData.key],
                    ));
                break;
            case 'spellname':
                examples.push(...this._spellsDataService.spells().map(spell => spell.name));
                break;
            case 'spelllevels':
                // All spell levels without -1
                examples = [...Object.values(SpellLevels)].slice(1);
                break;
            case 'spelltraditions':
                examples = ['', ...Object.values(SpellTraditions)];
                break;
            case 'spelltargets':
                examples = ['', 'Enemies', 'Others', 'Caster'];
                break;
            case 'onceEffects affected':
                examples.push(...['Focus', 'HP', 'Temporary HP']);
                this._featsDataService.featsAndFeatures(character.customFeats)
                    .filter(feat => feat.onceEffects.length)
                    .forEach(feat => {
                        examples.push(...feat.onceEffects.map(effect => effect.affected));
                    });
                this._conditionsDataService.conditions()
                    .filter(condition => condition.onceEffects.length)
                    .forEach(condition => {
                        examples.push(...condition.onceEffects.map(effect => effect.affected));
                    });
                this._activitiesDataService.activities()
                    .filter(activity => activity.onceEffects.length)
                    .forEach(activity => {
                        examples.push(...activity.onceEffects.map(effect => effect.affected));
                    });
                allEquipment()
                    .filter(item => item.activities.length)
                    .forEach(item => {
                        item.activities
                            .filter(activity => activity.onceEffects.length)
                            .forEach(activity => {
                                examples.push(...activity.onceEffects.map(effect => effect.affected));
                            });
                    });
                allConsumables()
                    .filter(item => item.onceEffects.length)
                    .forEach(item => {
                        examples.push(...item.onceEffects.map(effect => effect.affected));
                    });
                break;
            case 'onceEffects value':
                this._featsDataService.featsAndFeatures(character.customFeats)
                    .filter(feat => feat.onceEffects.length)
                    .forEach(feat => {
                        examples.push(...feat.onceEffects.map(effect => effect.value));
                    });
                this._conditionsDataService.conditions()
                    .filter(condition => condition.onceEffects.length)
                    .forEach(condition => {
                        examples.push(...condition.onceEffects.map(effect => effect.value));
                    });
                this._activitiesDataService.activities()
                    .filter(activity => activity.onceEffects.length)
                    .forEach(activity => {
                        examples.push(...activity.onceEffects.map(effect => effect.value));
                    });
                allEquipment()
                    .filter(item => item.activities.length)
                    .forEach(item => {
                        item.activities
                            .filter(activity => activity.onceEffects.length)
                            .forEach(activity => {
                                examples.push(...activity.onceEffects.map(effect => effect.value));
                            });
                    });
                allConsumables()
                    .filter(item => item.onceEffects.length)
                    .forEach(item => {
                        examples.push(...item.onceEffects.map(effect => effect.value));
                    });
                break;
            case 'effects affected':
                examples.push(...this._skillsDataService.skills(this._character.customSkills).map(skill => skill.name));
                examples.push(...this._abilitiesDataService.abilities().map(ability => ability.name));
                this._featsDataService.featsAndFeatures(character.customFeats)
                    .filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.affected));
                    });
                this._conditionsDataService.conditions()
                    .filter(condition => condition.effects.length)
                    .forEach(condition => {
                        examples.push(...condition.effects.map(effect => effect.affected));
                    });
                break;
            case 'effects value':
                this._featsDataService.featsAndFeatures(character.customFeats)
                    .filter(feat => feat.onceEffects.length)
                    .forEach(feat => {
                        examples.push(...feat.onceEffects.map(effect => effect.value));
                    });
                this._featsDataService.featsAndFeatures(character.customFeats)
                    .filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.value));
                    });
                this._conditionsDataService.conditions()
                    .filter(condition => condition.onceEffects.length)
                    .forEach(condition => {
                        examples.push(...condition.onceEffects.map(effect => effect.value));
                    });
                this._conditionsDataService.conditions()
                    .filter(condition => condition.effects.length)
                    .forEach(condition => {
                        examples.push(...condition.effects.map(effect => effect.value));
                    });
                this._activitiesDataService.activities()
                    .filter(activity => activity.onceEffects.length)
                    .forEach(activity => {
                        examples.push(...activity.onceEffects.map(effect => effect.value));
                    });
                allEquipment()
                    .filter(item => item.activities.length)
                    .forEach(item => {
                        item.activities
                            .filter(activity => activity.onceEffects.length)
                            .forEach(activity => {
                                examples.push(...activity.onceEffects.map(effect => effect.value));
                            });
                    });
                allConsumables()
                    .filter(item => item.onceEffects.length)
                    .forEach(item => {
                        examples.push(...item.onceEffects.map(effect => effect.value));
                    });
                examples = examples.filter(example =>
                    typeof example === 'string' &&
                    !example.toLowerCase().includes('object') &&
                    !example.toLowerCase().includes('heightened') &&
                    !example.toLowerCase().includes('value'),
                );
                break;
            case 'effects setvalue':
                this._featsDataService.featsAndFeatures(character.customFeats)
                    .filter(feat => feat.onceEffects.length)
                    .forEach(feat => {
                        examples.push(...feat.onceEffects.map(effect => effect.setValue));
                    });
                this._featsDataService.featsAndFeatures(character.customFeats)
                    .filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.setValue));
                    });
                this._conditionsDataService.conditions()
                    .filter(condition => condition.onceEffects.length)
                    .forEach(condition => {
                        examples.push(...condition.onceEffects.map(effect => effect.setValue));
                    });
                this._conditionsDataService.conditions()
                    .filter(condition => condition.effects.length)
                    .forEach(condition => {
                        examples.push(...condition.effects.map(effect => effect.setValue));
                    });
                this._activitiesDataService.activities()
                    .filter(activity => activity.onceEffects.length)
                    .forEach(activity => {
                        examples.push(...activity.onceEffects.map(effect => effect.setValue));
                    });
                allEquipment()
                    .filter(item => item.activities.length)
                    .forEach(item => {
                        item.activities
                            .filter(activity => activity.onceEffects.length)
                            .forEach(activity => {
                                examples.push(...activity.onceEffects.map(effect => effect.setValue));
                            });
                    });
                allConsumables()
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
                this._featsDataService.featsAndFeatures(character.customFeats)
                    .filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.title));
                    });
                this._conditionsDataService.conditions()
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
                allEquipment()
                    .filter(item => item.activities.length)
                    .forEach(item => {
                        examples.push(...item.activities
                            .filter(activity => activity.inputRequired.length)
                            .map(activity => activity.inputRequired),
                        );
                    });
                examples.push(...this._activitiesDataService.activities()
                    .filter(activity => activity.inputRequired.length)
                    .map(activity => activity.inputRequired));
                examples.push(...this._conditionsDataService.conditions()
                    .filter(condition => condition.inputRequired.length)
                    .map(condition => condition.inputRequired));
                break;
            case 'gainactivity name':
                examples.push(...this._activitiesDataService.activities().map(activity => activity.name));
                break;
            case 'showon':
                examples.push(...this._skillsDataService.skills(this._character.customSkills).map(skill => skill.name));
                examples.push(...this._abilitiesDataService.abilities().map(ability => ability.name));
                this._featsDataService.featsAndFeatures(character.customFeats)
                    .filter(feat => feat.hints.length)
                    .forEach(feat => {
                        examples.push(...feat.hints.filter(hint => hint.showon.length).map(hint => hint.showon));
                    });
                this._conditionsDataService.conditions()
                    .filter(condition => condition.hints.length)
                    .forEach(condition => {
                        examples.push(...condition.hints.filter(hint => hint.showon.length).map(hint => hint.showon));
                    });
                this._activitiesDataService.activities()
                    .filter(activity => activity.hints.length)
                    .forEach(activity => {
                        examples.push(...activity.hints.filter(hint => hint.showon.length).map(hint => hint.showon));
                    });
                allEquipment()
                    .filter(item => item.activities.length)
                    .forEach(item => {
                        item.activities
                            .filter(activity => activity.hints.length)
                            .forEach(activity => {
                                examples.push(...activity.hints.filter(hint => hint.showon.length).map(hint => hint.showon));
                            });
                    });
                allEquipment()
                    .filter(item => item.hints.length)
                    .forEach(item => {
                        examples.push(...item.hints.filter(hint => hint.showon.length).map(hint => hint.showon));
                    });
                break;
            case 'hints desc':
                this._activitiesDataService.activities().filter(activity => activity.hints.length)
                    .forEach(activity => {
                        examples.push(...activity.hints.filter(hint => hint.desc.length).map(hint => hint.desc));
                    });
                allEquipment()
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
                allEquipment()
                    .filter(item => item.choices.length)
                    .forEach(item => {
                        examples.push(...item.choices);
                    });
                break;
            case 'icontitleoverride':
                allItems()
                    .filter(item => item.iconTitleOverride)
                    .forEach(item => {
                        examples.push(item.iconTitleOverride);
                    });
                break;
            case 'iconvalueoverride':
                allItems()
                    .filter(item => item.iconTitleOverride)
                    .forEach(item => {
                        examples.push(item.iconValueOverride);
                    });
                break;
            case 'effects type':
                examples = ['', 'item', 'circumstance', 'status', 'proficiency'];
                break;
            case 'gaincondition name':
                examples.push(...this._conditionsDataService.conditions().map(condition => condition.name));
                break;
            case 'gaincondition alignmentfilter':
                examples.push(
                    'Chaotic',
                    'Chaotic Evil',
                    'Chaotic Good',
                    'Evil',
                    'Good',
                    'Lawful',
                    'Lawful Evil',
                    'Lawful Good',
                    'Neutral',
                    'Neutral Evil',
                    'Neutral Good',
                    '!Chaotic',
                    '!Chaotic Evil',
                    '!Chaotic Good',
                    '!Evil',
                    '!Good',
                    '!Lawful',
                    '!Lawful Evil',
                    '!Lawful Good',
                    '!Neutral',
                    '!Neutral Evil',
                    '!Neutral Good',
                );
                break;
            case 'gainitems name':
                examples = this._itemsDataService.storeItems()[parent.type].map((item: Item) => item.name);
                break;
            case 'gainitems on':
                examples = ['', 'equip', 'grant', 'use'];
                break;
            case 'gainitems expirationcondition':
                examples = ['', 'equipped', 'unequipped'];
                break;
            case 'dicesize':
                examples = [1, ...Object.values(DiceSizes)];
                break;
            case 'senses':
                examples = [
                    '',
                    'Low-Light Vision',
                    'Darkvision',
                    'Greater Darkvision',
                    'Scent 30 feet (imprecise)',
                    'Tremorsense 30 feet (imprecise)',
                ];
                break;
            default:
                allEquipment()
                    .forEach(item => {
                        extractExampleFromElement(item);
                    });
                allConsumables()
                    .forEach(item => {
                        extractExampleFromElement(item);
                    });
                break;

        }

        const maxLineLengthForExample = 90;

        const uniqueExamples = Array.from(new Set(examples.filter(example => example.toString().length <= maxLineLengthForExample)));

        return uniqueExamples.sort();
    }

    public itemSets(): Array<{ name: string; key: string }> {
        return ItemCollection.names;
    }

    public setItemType(): void {
        const parent = this.parent();

        parent.name = this._itemsDataService.storeItems()[parent.type][0].name;
    }

    private _cleanItems(): ItemCollection {
        return this._itemsDataService.cleanItems();
    }

    private _inventories(): Array<ItemCollection> {
        return this._character.inventories;
    }

}
