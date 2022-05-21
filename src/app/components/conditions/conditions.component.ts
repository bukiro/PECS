import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { TraitsService } from 'src/app/services/traits.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ConditionsService } from 'src/app/services/conditions.service';
import { Condition } from 'src/app/classes/Condition';
import { TimeService } from 'src/app/services/time.service';
import { EffectsService } from 'src/app/services/effects.service';
import { ItemProperty } from 'src/app/classes/ItemProperty';
import { EffectGain } from 'src/app/classes/EffectGain';
import { ItemsService } from 'src/app/services/items.service';
import { Creature } from 'src/app/classes/Creature';
import { Skill } from 'src/app/classes/Skill';
import { Ability } from 'src/app/classes/Ability';
import { Activity } from 'src/app/classes/Activity';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { Equipment } from 'src/app/classes/Equipment';
import { Consumable } from 'src/app/classes/Consumable';
import { EvaluationService } from 'src/app/services/evaluation.service';
import { CustomEffectsService } from 'src/app/services/customEffects.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-conditions',
    templateUrl: './conditions.component.html',
    styleUrls: ['./conditions.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionsComponent implements OnInit, OnDestroy {

    public endOn = 5;
    public value = 1;
    public heightened = 1;
    public showList = '';
    public showItem = '';
    public showCreature: 'Character' | 'Companion' | 'Familiar' = 'Character';
    public wordFilter = '';
    public permanent = true;
    public untilRest = false;
    public untilRefocus = false;
    public days = 0;
    public hours = 0;
    public minutes = 0;
    public turns = 0;
    private purpose: 'conditions' | 'customeffects' = 'conditions';
    public newEffect: EffectGain = new EffectGain();
    public validationError: Array<string> = [];
    public validationResult: Array<string> = [];
    public parseInt = parseInt;
    public range = 0;

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        private readonly characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly activitiesService: ActivitiesDataService,
        private readonly conditionsService: ConditionsService,
        private readonly effectsService: EffectsService,
        private readonly itemsService: ItemsService,
        private readonly timeService: TimeService,
        private readonly traitsService: TraitsService,
        private readonly evaluationService: EvaluationService,
        private readonly customEffectsService: CustomEffectsService,
    ) { }

    set_Range(amount: number) {
        this.range += amount;
    }

    toggle_List(type) {
        if (this.showList == type) {
            this.showList = '';
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
            this.showItem = '';
        } else {
            this.showItem = name;
        }
    }

    get_ShowItem() {
        return this.showItem;
    }

    toggle_Purpose(purpose: 'conditions' | 'customeffects') {
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
        this.refreshService.set_ToChange('Character', 'conditions');
        this.refreshService.process_ToChange();
    }

    get_TileMode() {
        return this.get_Character().settings.conditionsTileMode;
    }

    validate_DurationNumbers() {
        this.hours = Math.max(0, Math.min(23, this.hours));
        this.minutes = Math.max(0, Math.min(59, this.minutes));
        this.turns = Math.max(0, Math.min(9, this.turns));
        this.set_NonPermanent();
    }

    trackByIndex(index: number): number {
        return index;
    }

    check_Filter() {
        if (this.wordFilter.length < 5 && this.showList) {
            this.showList = '';
        }
    }

    set_Filter() {
        if (this.wordFilter) {
            this.showList = 'All';
        }
    }

    get_EndOn() {
        return this.endOn;
    }

    public still_loading(): boolean {
        return this.conditionsService.stillLoading() || this.characterService.stillLoading();
    }

    toggleConditionsMenu() {
        this.characterService.toggleMenu('conditions');
    }

    get_ConditionsMenuState() {
        return this.characterService.conditionsMenuState();
    }

    get_Character() {
        return this.characterService.character();
    }

    get_CompanionAvailable() {
        return this.characterService.isCompanionAvailable();
    }

    get_FamiliarAvailable() {
        return this.characterService.isFamiliarAvailable();
    }

    get_Companion() {
        return this.characterService.companion();
    }

    get_Familiar() {
        return this.characterService.familiar();
    }

    get_Creatures(companionAvailable: boolean = undefined, familiarAvailable: boolean = undefined) {
        return this.characterService.allAvailableCreatures(companionAvailable, familiarAvailable);
    }

    get_VisibleConditionsSet(type: string) {
        let typeKey = '';

        switch (type) {
            case 'Generic':
                typeKey = 'generic';
                break;
            case 'Activities':
                typeKey = 'activities';
                break;
            case 'Afflictions':
                typeKey = 'afflictions';
                break;
            case 'Alchemical Elixirs':
                typeKey = 'alchemicalelixirs';
                break;
            case 'Alchemical Tools':
                typeKey = 'alchemicaltools';
                break;
            case 'Ammunition':
                typeKey = 'ammunition';
                break;
            case 'Blood Magic':
                typeKey = 'bloodmagic';
                break;
            case 'Feats':
                typeKey = 'feats';
                break;
            case 'Other Consumables':
                typeKey = 'otherconsumables';
                break;
            case 'Potions':
                typeKey = 'potions';
                break;
            case 'Spells':
                typeKey = 'spells';
                break;
            case 'Talismans':
                typeKey = 'talismans';
                break;
            case 'Weapons':
                typeKey = 'weapons';
                break;
            case 'Worn Items':
                typeKey = 'wornitems';
                break;
            case 'Held Items':
                typeKey = 'helditems';
                break;
        }

        if (typeKey) {
            return this.get_Conditions('', typeKey)
                .filter(condition =>
                    !condition.hide &&
                    (
                        !this.wordFilter || (
                            condition.name
                                .concat(condition.desc)
                                .concat(condition.sourceBook)
                                .toLowerCase()
                                .includes(this.wordFilter.toLowerCase())
                        )
                    ),
                )
                .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
        }
    }

    get_Traits(traitName = '') {
        return this.traitsService.getTraits(traitName);
    }

    get_Conditions(name = '', type = '') {
        return this.conditionsService.conditions(name, type);
    }

    get_HeightenedDescription(condition: Condition) {
        if (this.heightened >= condition.minLevel) {
            return condition.heightenedText(condition.desc, this.heightened);
        } else {
            return condition.heightenedText(condition.desc, condition.minLevel);
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

    get_ConditionDuration(includeTurn = true) {
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
            (includeTurn ? (this.endOn == this.timeService.getYourTurn() ? 0 : 5) : 0)
        );
    }

    get_ConditionChoices(condition: Condition) {
        return condition.effectiveChoices(this.characterService, false);
    }

    get_Duration(duration: number = this.get_ConditionDuration(), inASentence = false) {
        return this.timeService.getDurationDescription(duration, true, inASentence);
    }

    add_Condition(creature: Creature, condition: Condition, duration: number = this.get_ConditionDuration(false), includeTurnState = true) {
        const newGain = new ConditionGain();

        newGain.name = condition.name;

        if (duration < 0 || duration == 1 || !includeTurnState) {
            newGain.duration = duration;
        } else {
            newGain.duration = duration + (this.endOn == this.timeService.getYourTurn() ? 0 : 5);
        }

        newGain.choice = condition.choice;

        if (condition.hasValue) {
            newGain.value = this.value;
        }

        if (condition.type == 'spells') {
            newGain.heightened = this.heightened;
        }

        newGain.source = 'Manual';
        this.characterService.addCondition(creature, newGain);
    }

    get_EffectsProperty() {
        return this.customEffectsService.get_EffectProperties.find(property => !property.parent && property.key == 'effects');
    }

    get_EffectValue(creature: Creature, effect: EffectGain) {
        //Send the effect's setValue or value to the EvaluationService to get its result.
        let result: string | number = null;
        let penalty = false;

        if (effect.setValue) {
            result = this.evaluationService.get_ValueFromFormula(effect.setValue, { characterService: this.characterService, effectsService: this.effectsService }, { creature, effect });
            penalty = false;
        } else if (effect.value) {
            result = this.evaluationService.get_ValueFromFormula(effect.value, { characterService: this.characterService, effectsService: this.effectsService }, { creature, effect });

            if (!isNaN(result as number)) {
                penalty = (result < 0) == (effect.affected != 'Bulk');
            } else {
                result = null;
            }
        }

        return { value: result, penalty };
    }

    get_Items() {
        return this.itemsService.get_Items();
    }

    get_Inventories() {
        return this.get_Character().inventories;
    }

    get_IsFormula(value: string) {
        if (value && isNaN(parseInt(value, 10))) {
            if (!value.match('^[0-9-]*$')) {
                return true;
            }
        }

        return false;
    }

    get_EffectInvalid() {
        if (!this.newEffect.affected || (!this.newEffect.toggle && !this.newEffect.setValue && this.newEffect.value == '0')) {
            return 'This effect will not do anything.';
        }
    }

    add_Effect(creature: Creature) {
        const duration: number = this.get_ConditionDuration(false);
        const newLength = creature.effects.push(Object.assign<EffectGain, EffectGain>(new EffectGain(), JSON.parse(JSON.stringify(this.newEffect))).recast());
        const newEffect = creature.effects[newLength - 1];

        if (duration == -1) {
            newEffect.maxDuration = newEffect.duration = duration;
        } else {
            newEffect.maxDuration = newEffect.duration = duration + (this.endOn == this.timeService.getYourTurn() ? 0 : 5);
        }

        this.refreshService.set_ToChange(creature.type, 'effects');
        this.refreshService.set_ToChange(creature.type, 'conditions');
        this.refreshService.process_ToChange();
    }

    new_CustomEffect(creature: Creature) {
        creature.effects.push(new EffectGain());
    }

    remove_Effect(creature: Creature, effect: EffectGain) {
        creature.effects.splice(creature.effects.indexOf(effect), 1);
        this.refreshService.set_ToChange(creature.type, 'effects');
        this.refreshService.set_ToChange(creature.type, 'conditions');
        this.refreshService.process_ToChange();
    }

    update_Effects(creature: Creature) {
        this.refreshService.set_ToChange(creature.type, 'effects');
        this.refreshService.set_ToChange(creature.type, 'conditions');
        this.refreshService.process_ToChange();
    }

    validate(creature: Creature, effect: EffectGain) {
        if (this.get_IsFormula(effect.value)) {
            effect.value = '0';
        }

        this.update_Effects(creature);
    }

    validate_AdvancedEffect(propertyData: ItemProperty, index: number) {
        this.validationError[index] = '';
        this.validationResult[index] = '';

        const value = this.newEffect[propertyData.key];

        if (propertyData.key == 'value' && propertyData.parent == 'effects') {
            if (value && value != '0') {
                const validationResult = this.evaluationService.get_ValueFromFormula(value, { characterService: this.characterService, effectsService: this.effectsService }, { creature: this.get_Character() })?.toString() || '0';

                if (validationResult && validationResult != '0' && (parseInt(validationResult, 10) || parseFloat(validationResult, 10))) {
                    if (parseFloat(validationResult) == parseInt(validationResult, 10)) {
                        this.validationError[index] = '';
                        this.validationResult[index] = parseInt(validationResult, 10).toString();
                    } else {
                        this.validationError[index] = 'This may result in a decimal value and be turned into a whole number.';
                        this.validationResult[index] = parseInt(validationResult, 10).toString();
                    }
                } else {
                    this.validationError[index] = 'This may result in an invalid value or 0. Invalid values will default to 0, and untyped effects without a value will not be displayed.';
                    this.validationResult[index] = parseInt(validationResult, 10).toString();
                }
            }
        } else if (propertyData.key == 'setValue' && propertyData.parent == 'effects') {
            if (value && value != '0') {
                const validationResult = this.evaluationService.get_ValueFromFormula(value, { characterService: this.characterService, effectsService: this.effectsService }, { creature: this.get_Character() })?.toString() || null;

                if (validationResult && (parseInt(validationResult, 10) || parseFloat(validationResult, 10)) || parseInt(validationResult, 10) == 0) {
                    if (parseFloat(validationResult, 10) == parseInt(validationResult, 10)) {
                        this.validationError[index] = '';
                        this.validationResult[index] = parseInt(validationResult, 10).toString();
                    } else {
                        this.validationError[index] = 'This may result in a decimal value and be turned into a whole number.';
                        this.validationResult[index] = parseInt(validationResult, 10).toString();
                    }
                } else {
                    this.validationError[index] = 'This may result in an invalid value. Absolute effects with an invalid value will not be applied.';
                    this.validationResult[index] = parseInt(validationResult, 10).toString();
                }
            }
        } else if (propertyData.validation == '1plus') {
            if (parseInt(value, 10) >= 1) {
                //Do nothing if the validation is successful.
            } else {
                this.newEffect[propertyData.key] = 1;
            }
        } else if (propertyData.validation == '0plus') {
            if (parseInt(value, 10) >= 0) {
                //Do nothing if the validation is successful.
            } else {
                this.newEffect[propertyData.key] = 0;
            }
        } else if (propertyData.validation == '=1plus') {
            if (parseInt(value, 10) >= -1) {
                //Do nothing if the validation is successful.
            } else {
                this.newEffect[propertyData.key] = -1;
            }
        } else if (propertyData.validation == '0minus') {
            if (parseInt(value, 10) <= 0) {
                //Do nothing if the validation is successful.
            } else {
                this.newEffect[propertyData.key] = 0;
            }
        }
    }

    get_CustomEffectProperties() {
        const customEffectsService = this.customEffectsService;

        function get_PropertyData(key: string) {
            return customEffectsService.get_EffectProperties.find(property => property.key == key);
        }

        return Object.keys(this.newEffect)
            .map(key => get_PropertyData(key))
            .filter(property => property != undefined)
            .sort((a, b) => (a.group + a.priority == b.group + b.priority) ? 0 : ((a.group + a.priority > b.group + b.priority) ? 1 : -1));
    }

    get_Examples(propertyData: ItemProperty) {
        let examples: Array<string> = [''];

        switch (propertyData.examples) {
            case 'effects affected':
                examples.push(...this.characterService.skills(this.get_Character()).map((skill: Skill) => skill.name));
                examples.push(...this.characterService.abilities().map((ability: Ability) => ability.name));
                this.characterService.featsAndFeatures().filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.affected));
                    });
                this.characterService.conditions().filter(condition => condition.effects.length)
                    .forEach((condition: Condition) => {
                        examples.push(...condition.effects.map(effect => effect.affected));
                    });
                break;
            case 'effects value':
                this.characterService.featsAndFeatures().filter(feat => feat.onceEffects.length)
                    .forEach(feat => {
                        examples.push(...feat.onceEffects.map(effect => effect.value));
                    });
                this.characterService.featsAndFeatures().filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.value));
                    });
                this.characterService.conditions().filter(condition => condition.onceEffects.length)
                    .forEach((condition: Condition) => {
                        examples.push(...condition.onceEffects.map(effect => effect.value));
                    });
                this.characterService.conditions().filter(condition => condition.effects.length)
                    .forEach((condition: Condition) => {
                        examples.push(...condition.effects.map(effect => effect.value));
                    });
                this.activitiesService.activities().filter(activity => activity.onceEffects.length)
                    .forEach((activity: Activity) => {
                        examples.push(...activity.onceEffects.map(effect => effect.value));
                    });
                this.get_Items().allEquipment()
                    .concat(...this.get_Inventories().map(inventory => inventory.allEquipment()))
                    .filter(item => item.activities.length)
                    .forEach((item: Equipment) => {
                        item.activities.filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                            examples.push(...activity.onceEffects.map(effect => effect.value));
                        });
                    });
                this.get_Items().allConsumables()
                    .concat(...this.get_Inventories().map(inventory => inventory.allConsumables()))
                    .filter(item => item.onceEffects.length)
                    .forEach((item: Consumable) => {
                        examples.push(...item.onceEffects.map(effect => effect.value));
                    });
                examples = examples.filter(example => typeof example === 'string' && !example.toLowerCase().includes('object') && !example.toLowerCase().includes('heightened') && !example.toLowerCase().includes('value'));
                break;
            case 'effects setvalue':
                this.characterService.featsAndFeatures().filter(feat => feat.onceEffects.length)
                    .forEach(feat => {
                        examples.push(...feat.onceEffects.map(effect => effect.setValue));
                    });
                this.characterService.featsAndFeatures().filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.setValue));
                    });
                this.characterService.conditions().filter(condition => condition.onceEffects.length)
                    .forEach((condition: Condition) => {
                        examples.push(...condition.onceEffects.map(effect => effect.setValue));
                    });
                this.characterService.conditions().filter(condition => condition.effects.length)
                    .forEach((condition: Condition) => {
                        examples.push(...condition.effects.map(effect => effect.setValue));
                    });
                this.activitiesService.activities().filter(activity => activity.onceEffects.length)
                    .forEach((activity: Activity) => {
                        examples.push(...activity.onceEffects.map(effect => effect.setValue));
                    });
                this.get_Items().allEquipment()
                    .concat(...this.get_Inventories().map(inventory => inventory.allEquipment()))
                    .filter(item => item.activities.length)
                    .forEach((item: Equipment) => {
                        item.activities.filter(activity => activity.onceEffects.length).forEach((activity: Activity) => {
                            examples.push(...activity.onceEffects.map(effect => effect.setValue));
                        });
                    });
                this.get_Items().allConsumables()
                    .concat(...this.get_Inventories().map(inventory => inventory.allConsumables()))
                    .filter(item => item.onceEffects.length)
                    .forEach((item: Consumable) => {
                        examples.push(...item.onceEffects.map(effect => effect.setValue));
                    });
                examples = examples.filter(example => typeof example === 'string' && !example.toLowerCase().includes('object') && !example.toLowerCase().includes('heightened') && !example.toLowerCase().includes('value'));
                break;
            case 'effects title':
                this.characterService.featsAndFeatures().filter(feat => feat.effects.length)
                    .forEach(feat => {
                        examples.push(...feat.effects.map(effect => effect.title));
                    });
                this.characterService.conditions().filter(condition => condition.effects.length)
                    .forEach((condition: Condition) => {
                        examples.push(...condition.effects.map(effect => effect.title));
                    });
                examples = examples.filter(example => typeof example === 'string' && !example.toLowerCase().includes('object') && !example.toLowerCase().includes('heightened'));
                break;
            case 'effects type':
                examples = this.get_BonusTypes();
                break;
        }

        const uniqueExamples = Array.from(new Set(examples.filter(example => example.length <= 90)));

        return uniqueExamples.sort();
    }

    get_BonusTypes() {
        return this.effectsService.bonusTypes.map(type => type == 'untyped' ? '' : type);
    }

    public ngOnInit(): void {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe(target => {
                if (['conditions', 'all'].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe(view => {
                if (view.creature.toLowerCase() == 'character' && ['conditions', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
