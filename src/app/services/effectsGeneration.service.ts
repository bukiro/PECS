/* eslint-disable max-lines */
/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { Armor } from 'src/app/classes/Armor';
import { Character as CharacterModel } from 'src/app/classes/Character';
import { CharacterService } from 'src/app/services/character.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ConditionsService } from 'src/app/services/conditions.service';
import { Creature } from 'src/app/classes/Creature';
import { Effect } from 'src/app/classes/Effect';
import { EffectGain } from 'src/app/classes/EffectGain';
import { EffectsService } from 'src/app/services/effects.service';
import { Equipment } from 'src/app/classes/Equipment';
import { EvaluationService } from 'src/app/services/evaluation.service';
import { Familiar as FamiliarModel } from 'src/app/classes/Familiar';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { Item } from 'src/app/classes/Item';
import { Material } from 'src/app/classes/Material';
import { RefreshService } from 'src/app/services/refresh.service';
import { Rune } from 'src/app/classes/Rune';
import { Shield } from 'src/app/classes/Shield';
import { Specialization } from 'src/app/classes/Specialization';
import { WornItem } from 'src/app/classes/WornItem';
import { ItemsService } from 'src/app/services/items.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { ConditionEffectsObject } from '../classes/ConditionEffectsObject';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { BonusTypes } from 'src/libs/shared/definitions/bonusTypes';
import { AbilitiesDataService } from '../core/services/data/abilities-data.service';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { WeaponPropertiesService } from 'src/libs/shared/services/weapon-properties/weapon-properties.service';
import { ArmorPropertiesService } from 'src/libs/shared/services/armor-properties/armor-properties.service';
import { ActivityGainPropertiesService } from 'src/libs/shared/services/activity-gain-properties/activity-gain-properties.service';
import { CreatureEffectsGenerationService } from 'src/libs/shared/effects-generation/services/creature-effects-generation/creature-effects-generation.service';
import { HintEffectsObject } from 'src/libs/shared/effects-generation/definitions/interfaces/HintEffectsObject';
import { ItemTraitsService } from 'src/libs/shared/services/item-traits/item-traits.service';
import { ItemEffectsGenerationService } from 'src/libs/shared/effects-generation/services/item-effects-generation/item-effects-generation.service';

interface EffectObject {
    effects: Array<EffectGain>;
    effectiveName?: () => string;
    name?: string;
}
interface EffectContext {
    readonly creature: Creature;
    readonly object?: EffectObject;
    readonly parentConditionGain?: ConditionGain;
    readonly parentItem?: Item | Material;
}
interface EffectOptions {
    readonly name?: string;
    readonly pretendCharacterLevel?: number;
}

@Injectable({
    providedIn: 'root',
})
export class EffectsGenerationService {

    constructor(
        private readonly _evaluationService: EvaluationService,
        private readonly _effectsService: EffectsService,
        private readonly _conditionsService: ConditionsService,
        private readonly _refreshService: RefreshService,
        private readonly _itemsService: ItemsService,
        private readonly _abilitiesDataService: AbilitiesDataService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _weaponPropertiesService: WeaponPropertiesService,
        private readonly _armorPropertiesService: ArmorPropertiesService,
        private readonly _activityGainPropertyService: ActivityGainPropertiesService,
        private readonly _creatureEffectsGenerationService: CreatureEffectsGenerationService,
        private readonly _itemTraitsService: ItemTraitsService,
        private readonly _itemEffectsGenerationService: ItemEffectsGenerationService,
    ) { }

    public effectsFromEffectObject(
        object: EffectObject,
        services: { readonly characterService: CharacterService },
        context: EffectContext,
        options: EffectOptions = {},
    ): Array<Effect> {
        context = {
            creature: null,
            object,
            parentConditionGain: null,
            parentItem: null, ...context,
        };
        options = {
            name: '',
            pretendCharacterLevel: 0, ...options,
        };

        //If an object has a simple instruction in effects, such as "affected":"Athletics" and "value":"+2", turn it into an Effect here,
        // then mark the effect as a penalty if the change is negative (except for Bulk).
        //Formulas are allowed, such as "Character.level / 2".
        //Try to get the type, too - if no type is given, set it to untyped.
        //Return an array of Effect objects
        const objectEffects: Array<Effect> = [];
        //Get the object name unless a name is enforced.
        let source: string = options.name ? options.name : (object.effectiveName ? object.effectiveName() : object.name);
        const Character = services.characterService.character;
        const Companion = services.characterService.companion;
        const Familiar = services.characterService.familiar;
        const evaluationService = this._evaluationService;
        const effectsService = this._effectsService;

        //EffectGains come with values that contain a statement.
        //This statement is evaluated by the EvaluationService and then validated here in order to build a working Effect.
        object.effects
            .filter(effectGain =>
                effectGain.resonant
                    ? (object instanceof WornItem && object.isSlottedAeonStone)
                    : true,
            ).forEach((effectGain: EffectGain) => {
                const valueFromFormula = (formula: string): string | number =>
                    evaluationService.valueFromFormula(
                        formula,
                        { characterService: services.characterService, effectsService },
                        { ...context, effect: effectGain, effectSourceName: source },
                        options,
                    );

                let shouldShowEffect: boolean = effectGain.show;
                let type = 'untyped';
                let isPenalty = false;
                let value = '0';
                let valueNumber = 0;
                let setValue = '';
                let isToggledEffect: boolean = effectGain.toggle;
                let sourceId = '';

                if (object === context.creature) {
                    source = effectGain.source || 'Custom Effect';
                }

                try {
                    valueNumber = valueFromFormula(effectGain.value) as number;

                    if (!isNaN(Number(valueNumber)) && Number(valueNumber) !== Infinity) {
                        valueNumber = Number(valueNumber);
                        value = valueNumber.toString();
                    }
                } catch (error) {
                    valueNumber = 0;
                    value = '0';
                }

                if (effectGain.setValue) {
                    try {
                        setValue = valueFromFormula(effectGain.setValue).toString();
                    } catch (error) {
                        setValue = '';
                    }
                }

                if (effectGain.type) {
                    type = effectGain.type;
                }

                if (setValue) {
                    isPenalty = false;
                    value = '0';
                } else {
                    //Negative values are penalties unless Bulk is affected.
                    isPenalty = (valueNumber < 0) === (effectGain.affected !== 'Bulk');
                }

                if (effectGain.conditionalToggle) {
                    try {
                        isToggledEffect = valueFromFormula(effectGain.conditionalToggle).toString() && true;
                    } catch (error) {
                        isToggledEffect = false;
                    }
                }

                let title = '';

                if (effectGain.title) {
                    try {
                        //We insert value and setValue here (if needed) because they will not be available in the evaluation.
                        const testTitle =
                            effectGain.title
                                .replace(/(^|[^\w])value($|[^\w])/g, `$1${ value }$2`)
                                .replace(/(^|[^\w])setValue($|[^\w])/g, `$1${ setValue }$2`);

                        title = valueFromFormula(testTitle).toString();
                    } catch (error) {
                        title = '';
                    }
                }

                //Hide all relative effects that come from feats, so we don't see green effects permanently after taking a feat.
                const shouldHideEffect = (
                    shouldShowEffect === undefined &&
                    object instanceof Feat
                );

                if (shouldHideEffect) {
                    shouldShowEffect = false;
                }

                if (source === 'Custom Effect') {
                    shouldShowEffect = true;
                }

                //Effects can affect another creature. In that case, remove the notation and change the target.
                let target: string = context.creature.id;
                let affected: string = effectGain.affected;

                if (effectGain.affected.includes('Character:')) {
                    target = Character?.id || '';
                    affected = effectGain.affected.replace('Character:', '');
                }

                if (effectGain.affected.includes('Companion:')) {
                    target = Companion?.id || '';
                    affected = effectGain.affected.replace('Companion:', '');
                }

                if (effectGain.affected.includes('Familiar:')) {
                    target = Familiar?.id || '';
                    affected = effectGain.affected.replace('Familiar:', '');
                }

                if (context.parentConditionGain) {
                    sourceId = context.parentConditionGain.id;
                } else if (context.parentItem instanceof Item) {
                    sourceId = context.parentItem.id;
                } else if (context.object instanceof Creature) {
                    sourceId = context.object.id;
                }

                //Effects that have neither a value nor a toggle don't get created.
                const isFunctionalEffect = (
                    isToggledEffect ||
                    !!setValue ||
                    parseInt(value, 10) !== 0
                );

                if (isFunctionalEffect) {
                    objectEffects.push(
                        Object.assign(
                            new Effect(value),
                            {
                                creature: target,
                                type,
                                target: affected,
                                setValue,
                                toggle: isToggledEffect,
                                title,
                                source,
                                penalty: isPenalty,
                                show: shouldShowEffect,
                                duration: effectGain.duration,
                                maxDuration: effectGain.maxDuration,
                                cumulative: effectGain.cumulative,
                                sourceId,
                            },
                        ),
                    );
                }
            });

        return objectEffects;
    }

    public initialize(characterService: CharacterService): void {
        //Only start subscribing to effects refreshing commands after the character has finished loading.
        const waitForCharacterService = setInterval(() => {
            if (!characterService.stillLoading) {
                clearInterval(waitForCharacterService);
                this._refreshService.componentChanged$
                    .subscribe(target => {
                        if (['effects', 'all', CreatureTypes.Character, 'Companion', 'Familiar'].includes(target)) {
                            if (target in CreatureTypes) {
                                this._updateEffectsAndConditions(target as CreatureTypes, { characterService });
                            } else {
                                this._updateEffectsAndConditions(CreatureTypes.Character, { characterService });

                                if (characterService.isCompanionAvailable()) {
                                    this._updateEffectsAndConditions(CreatureTypes.AnimalCompanion, { characterService });
                                }

                                if (characterService.isFamiliarAvailable()) {
                                    this._updateEffectsAndConditions(CreatureTypes.Familiar, { characterService });
                                }
                            }

                        }
                    });
                this._refreshService.detailChanged$
                    .subscribe(target => {
                        if (['effects', 'all'].includes(target.target) && target.creature !== '') {
                            this._updateEffectsAndConditions(target.creature, { characterService });
                        }
                    });
            }
        }, Defaults.waitForServiceDelay);
    }

    private _effectsFromOtherCreatures(creature: Creature): Array<Effect> {
        const foreignEffects: Array<Effect> = [];

        Object.values(CreatureTypes)
            .filter(otherCreatureType => otherCreatureType !== creature.type)
            .forEach(otherCreatureType => {
                foreignEffects.push(
                    ...this._effectsService.effects(otherCreatureType).all.filter(effect => effect.creature === creature.id),
                );
            });

        return foreignEffects;
    }

    private _collectEffectItems(
        creature: Creature,
    ): { objects: Array<Equipment | Specialization | Rune>; hintSets: Array<HintEffectsObject> } {
        //Collect items and item specializations that may have effects, and their hints, and return them in two lists.

        let objects: Array<Equipment | Specialization | Rune> = [];
        let hintSets: Array<HintEffectsObject> = [];

        const doItemEffectsApply = (item: Equipment): boolean => (
            item.investedOrEquipped() &&
            item.amount &&
            !item.broken
        );

        creature.inventories.forEach(inventory => {
            inventory.allEquipment().filter(item =>
                doItemEffectsApply(item),
            )
                .forEach((item: Equipment) => {
                    objects = objects.concat(this._itemEffectsGenerationService.effectsGenerationObjects(item, { creature }));
                    hintSets = hintSets.concat(item.effectsGenerationHints());
                });
        });

        //If too many wayfinders are invested with slotted aeon stones, all aeon stone effects are ignored.
        if (this._itemsService.hasTooManySlottedAeonStones(creature)) {
            objects = objects.filter(object => !(object instanceof WornItem && object.isSlottedAeonStone));
            hintSets = hintSets.filter(set => !(set.parentItem && set.parentItem instanceof WornItem && set.parentItem.isSlottedAeonStone));
        }

        return { objects, hintSets };
    }

    private _collectTraitEffectHints(
        creature: Creature,
        services: { readonly characterService: CharacterService },
    ): Array<HintEffectsObject> {
        const hintSets: Array<HintEffectsObject> = [];

        services.characterService.traitsService.traits().filter(trait => trait.hints.length && trait.itemsWithThisTrait(creature).length)
            .forEach(trait => {
                trait.hints.forEach(hint => {
                    hintSets.push({ hint, objectName: trait.name });
                });
            });

        return hintSets;
    }

    private _collectEffectConditions(
        creature: Creature,
        services: { readonly characterService: CharacterService },
    ): { conditions: Array<ConditionEffectsObject>; hintSets: Array<HintEffectsObject> } {
        const hintSets: Array<HintEffectsObject> = [];
        const conditions: Array<ConditionEffectsObject> = [];
        const appliedConditions = services.characterService.currentCreatureConditions(creature).filter(condition => condition.apply);

        appliedConditions.forEach(gain => {
            const originalCondition = services.characterService.conditions(gain.name)[0];

            if (originalCondition) {
                const conditionEffectsObject: ConditionEffectsObject =
                    Object.assign(new ConditionEffectsObject(originalCondition.effects), gain);

                conditions.push(conditionEffectsObject);
                originalCondition?.hints
                    ?.filter(hint => (!hint.conditionChoiceFilter.length || hint.conditionChoiceFilter.includes(gain.choice)))
                    .forEach(hint => {
                        hintSets.push({ hint, parentConditionGain: gain, objectName: originalCondition.name });
                    });
            }
        });

        return { conditions, hintSets };
    }

    private _collectActivityEffectHints(
        creature: Creature,
        services: { readonly characterService: CharacterService },
    ): Array<HintEffectsObject> {
        const hintSets: Array<HintEffectsObject> = [];

        services.characterService.creatureOwnedActivities(creature, creature.level, true).filter(activity => activity.active)
            .forEach(gain => {
                this._activityGainPropertyService.originalActivity(gain)?.hints?.forEach(hint => {
                    hintSets.push({ hint, objectName: gain.name });
                });
            });

        return hintSets;
    }

    private _generateObjectEffects(creature: Creature, services: { readonly characterService: CharacterService }): Array<Effect> {
        //Collect objects, conditions and objects' hints to generate effects from. Hint effects will be handled separately at first.
        let objects: Array<Equipment | Rune | Specialization> = [];
        let feats: Array<Feat | AnimalCompanionSpecialization> = [];
        let hintSets: Array<HintEffectsObject> = [];
        let conditions: Array<ConditionEffectsObject> = [];

        //Collect the creature's feats/abilities/specializations and their hints.
        const creatureObjects = this._creatureEffectsGenerationService.creatureEffectsGenerationObjects(creature);

        feats = feats.concat(creatureObjects.feats);
        hintSets = hintSets.concat(creatureObjects.hintSets);

        //Collect inventory items and their hints, if the item is equipped and invested as needed.
        const effectItems = this._collectEffectItems(creature);

        objects = objects.concat(effectItems.objects);
        hintSets = hintSets.concat(effectItems.hintSets);

        //Collect hints of Traits that are on currently equipped items.
        hintSets = hintSets.concat(this._collectTraitEffectHints(creature, services));

        //Collect active conditions and their hints.
        const effectConditions = this._collectEffectConditions(creature, services);

        conditions = conditions.concat(effectConditions.conditions);
        hintSets = hintSets.concat(effectConditions.hintSets);

        //Collect hints of active activities.
        hintSets = hintSets.concat(this._collectActivityEffectHints(creature, services));

        //Create object effects from abilities and items, then add effects from conditions.
        let objectEffects: Array<Effect> = [];

        objects.filter(object => object.effects.length).forEach(object => {
            objectEffects = objectEffects.concat(this.effectsFromEffectObject(object, services, { creature }));
        });
        conditions.filter(object => object.effects.length).forEach(conditionEffectsObject => {
            objectEffects = objectEffects.concat(
                this.effectsFromEffectObject(conditionEffectsObject, services, { creature, parentConditionGain: conditionEffectsObject }),
            );
        });

        //Create object effects the creature. All effects from the creature should be SHOWN, after which they are moved into objectEffects.
        let creatureEffects: Array<Effect> = [];

        creatureEffects = creatureEffects.concat(this.effectsFromEffectObject(creature, services, { creature }));
        creatureEffects.forEach(effect => {
            effect.show = true;
        });

        // Create object effects from creature feats/abilities and store them in a separate list.
        // All effects from feats should be HIDDEN, after which they are moved into objectEffects.
        let featEffects: Array<Effect> = [];

        feats.filter(object => object.effects?.length).forEach(object => {
            featEffects = featEffects.concat(this.effectsFromEffectObject(object, services, { creature }));
        });
        featEffects.forEach(effect => {
            effect.show = false;
        });

        // Create object effects from active hints and store them in a separate list.
        // All effects from hints should be SHOWN, after which they are moved into objectEffects.
        const hintEffects: Array<Effect> = [];

        hintSets
            .filter(hintSet =>
                hintSet.hint.anyActive &&
                hintSet.hint.effects?.length,
            )
            .forEach(hintSet => {
                hintEffects.push(
                    ...this.effectsFromEffectObject(
                        hintSet.hint,
                        services,
                        { creature, parentItem: hintSet.parentItem, parentConditionGain: hintSet.parentConditionGain },
                        { name: `conditional, ${ hintSet.objectName }` },
                    ),
                );
            });
        hintEffects.forEach(effect => {
            effect.show = true;
        });

        return objectEffects.concat(creatureEffects).concat(featEffects)
            .concat(hintEffects);
    }

    private _generateArmorEffects(
        armor: Armor,
        services: { readonly characterService: CharacterService },
        context: { readonly creature: Creature },
        options: { readonly ignoreArmorPenalties: boolean; readonly ignoreArmorSpeedPenalties: boolean },
    ): Array<Effect> {
        const itemEffects: Array<Effect> = [];

        this._itemTraitsService.cacheItemEffectiveTraits(armor, context);

        const armorTraits = armor.$traits;

        const addEffect = (
            addOptions: {
                type: 'item' | 'untyped';
                target: string;
                value: string;
                source: string;
                penalty: boolean;
                apply: boolean;
            },
        ): void => {
            itemEffects.push(Object.assign(new Effect(),
                {
                    creature: context.creature.id,
                    type: addOptions.type,
                    target: addOptions.target,
                    value: addOptions.value,
                    setValue: '',
                    toggle: false,
                    title: '',
                    source: addOptions.source,
                    penalty: addOptions.penalty,
                    apply: addOptions.apply,
                },
            ));
        };

        //For Saving Throws, add any resilient runes on the equipped armor.
        const resilient = armor.effectiveResilient();

        const shouldApplyResilientRune = (
            resilient > 0 &&
            !armor.broken
        );

        if (shouldApplyResilientRune) {
            addEffect({
                type: 'item',
                target: 'Saving Throws',
                value: `+${ resilient }`,
                source: armor.resilientTitle(resilient),
                penalty: false,
                apply: undefined,
            });
        }

        //Add broken penalty if the armor is broken.
        if (armor.broken) {
            let brokenPenalty = '';

            switch (armor.effectiveProficiency()) {
                case 'Light Armor':
                    brokenPenalty = '-1';
                    break;
                case 'Medium Armor':
                    brokenPenalty = '-2';
                    break;
                case 'Heavy Armor':
                    brokenPenalty = '-3';
                    break;
                default: break;
            }

            if (brokenPenalty) {
                addEffect({ type: 'untyped', target: 'AC', value: brokenPenalty, source: 'Broken Armor', penalty: true, apply: undefined });
            }
        }

        //Add skill and speed penalties from armor strength requirements and certain traits.
        if (!options.ignoreArmorPenalties) {
            //If an armor has a skillpenalty or a speedpenalty, check if Strength meets its strength requirement.
            const strength = this._abilitiesDataService.abilities('Strength')[0];
            const strengthValue =
                (context.creature instanceof FamiliarModel)
                    ? 0
                    : this._abilityValuesService
                        .value(strength, context.creature as CharacterModel | AnimalCompanion)
                        .result;
            const name = armor.effectiveName();
            const skillPenalty = armor.effectiveSkillPenalty();
            const skillPenaltyString = skillPenalty.toString();
            const speedPenalty = armor.effectiveSpeedPenalty();
            const speedPenaltyString = speedPenalty.toString();

            if (!(strengthValue >= armor.effectiveStrengthRequirement())) {
                if (skillPenalty) {
                    //You are not strong enough to act freely in this armor.
                    //If the item has the Flexible trait, its penalty doesn't apply to Acrobatics and Athletics.
                    //We push this as an apply:false effect to each so you can see that (and why) you were spared from it.
                    //We also add a note to the source for clarity.
                    if (armorTraits.includes('Flexible')) {
                        addEffect({
                            type: 'item',
                            target: 'Acrobatics',
                            value: skillPenaltyString, source: `${ name }(cancelled by Flexible)`,
                            penalty: true,
                            apply: false,
                        });
                        addEffect({
                            type: 'item',
                            target: 'Athletics',
                            value: skillPenaltyString,
                            source: `${ name }(cancelled by Flexible)`,
                            penalty: true,
                            apply: false,
                        });
                    } else {
                        addEffect({
                            type: 'item',
                            target: 'Acrobatics',
                            value: skillPenaltyString,
                            source: name,
                            penalty: true,
                            apply: undefined,
                        });
                        addEffect({
                            type: 'item',
                            target: 'Athletics',
                            value: skillPenaltyString,
                            source: name,
                            penalty: true,
                            apply: undefined,
                        });
                    }

                    //These two always apply unless you are strong enough.
                    addEffect({
                        type: 'item',
                        target: 'Stealth',
                        value: skillPenaltyString,
                        source: name,
                        penalty: true,
                        apply: undefined,
                    });
                    addEffect({
                        type: 'item',
                        target: 'Thievery',
                        value: skillPenaltyString,
                        source: name,
                        penalty: true,
                        apply: undefined,
                    });
                }

                if (speedPenalty && !options.ignoreArmorSpeedPenalties) {
                    //You are not strong enough to move unhindered in this armor. You get a speed penalty.
                    addEffect({
                        type: 'untyped',
                        target: 'Speed',
                        value: speedPenaltyString,
                        source: name,
                        penalty: true,
                        apply: undefined,
                    });
                }
            } else {
                if (skillPenalty) {
                    //If you ARE strong enough, we push some not applying effects so you can feel good about that.
                    addEffect({
                        type: 'item',
                        target: 'Acrobatics',
                        value: skillPenaltyString,
                        source: `${ name } (cancelled by Strength)`,
                        penalty: true,
                        apply: false,
                    });
                    addEffect({
                        type: 'item',
                        target: 'Athletics',
                        value: skillPenaltyString,
                        source: `${ name } (cancelled by Strength)`,
                        penalty: true,
                        apply: false,
                    });
                    addEffect({
                        type: 'item',
                        target: 'Thievery',
                        value: skillPenaltyString,
                        source: `${ name } (cancelled by Strength)`,
                        penalty: true,
                        apply: false,
                    });

                    // UNLESS the item is also Noisy, in which case you do get the stealth penalty
                    // because you are dummy thicc and the clap of your ass cheeks keeps alerting the guards.
                    if (armorTraits.includes('Noisy')) {
                        addEffect({
                            type: 'item',
                            target: 'Stealth',
                            value: skillPenaltyString,
                            source: `${ name } (Noisy)`,
                            penalty: true,
                            apply: undefined,
                        });
                    } else {
                        addEffect({
                            type: 'item',
                            target: 'Stealth',
                            value: skillPenaltyString,
                            source: `${ name } (cancelled by Strength)`,
                            penalty: true,
                            apply: false,
                        });
                    }
                }

                if (speedPenalty && !options.ignoreArmorSpeedPenalties) {
                    // You are strong enough to ignore the speed penalty,
                    // but if the armor is particularly heavy, your penalty is only lessened.
                    const speedPenaltyReduction = 5;

                    if (speedPenalty < -speedPenaltyReduction) {
                        //In this case we push both the avoided and the actual effect so you can feel at least a little good about yourself.
                        addEffect({
                            type: 'untyped',
                            target: 'Speed',
                            value: (speedPenalty + speedPenaltyReduction).toString(),
                            source: name,
                            penalty: true,
                            apply: true,
                        });
                        addEffect({
                            type: 'untyped',
                            target: 'Speed',
                            value: speedPenaltyString,
                            source: `${ name } (cancelled by Strength)`,
                            penalty: true,
                            apply: false,
                        });
                    } else {
                        //If you are strong enough and the armor only gave -5ft penalty, you get a fully avoided effect to gaze at.
                        addEffect({
                            type: 'untyped',
                            target: 'Speed',
                            value: speedPenaltyString,
                            source: `${ name } (cancelled by Strength)`,
                            penalty: true,
                            apply: false,
                        });
                    }
                }
            }
        }

        return itemEffects;
    }

    private _generateShieldEffects(
        shield: Shield,
        services: { readonly characterService: CharacterService },
        context: { readonly creature: Creature },
    ): Array<Effect> {
        //Get shield bonuses from raised shields
        //If a shield is raised, add its circumstance bonus to AC with a + in front, but subtract 2 if it's shoddy.
        const itemEffects: Array<Effect> = [];

        const addEffect = (
            addOptions: {
                type: 'circumstance' | 'untyped' | 'item';
                target: string;
                value: string;
                source: string;
                penalty: boolean;
                apply: boolean;
            }): void => {
            itemEffects.push(
                Object.assign(
                    new Effect(addOptions.value),
                    {
                        creature: context.creature.id,
                        type: addOptions.type,
                        target: addOptions.target,
                        source: addOptions.source,
                        penalty: addOptions.penalty,
                        apply: addOptions.apply,
                    }));
        };

        const name = shield.effectiveName();

        const doesShieldBonusApply = (
            shield.raised &&
            !shield.broken
        );

        if (doesShieldBonusApply) {
            const shieldBonus = shield.effectiveACBonus();

            if (shieldBonus) {
                addEffect({
                    type: 'circumstance',
                    target: 'AC',
                    value: `+${ shieldBonus }`,
                    source: name,
                    penalty: false,
                    apply: undefined,
                });

                if (shield.$shoddy) {
                    addEffect({ type: 'item', target: 'AC', value: '-2', source: 'Shoddy Shield', penalty: true, apply: undefined });
                }
            }

            //Reflexive Shield adds the same bonus to your reflex save. Only a Character can have it.
            if (context.creature instanceof CharacterModel && context.creature.hasFeat('Reflexive Shield', services)) {
                addEffect({
                    type: 'circumstance',
                    target: 'Reflex',
                    value: `+${ shieldBonus }`,
                    source: 'Reflexive Shield',
                    penalty: false,
                    apply: undefined,
                });
            }
        }

        if (shield.speedpenalty) {
            //Shields don't have a strength requirement for speed penalties. In this case, the penalty just always applies.
            addEffect({
                type: 'untyped',
                target: 'Speed',
                value: shield.speedpenalty.toString(),
                source: name,
                penalty: true,
                apply: undefined,
            });
        }

        return itemEffects;
    }

    private _generateCalculatedItemEffects(
        creature: Creature,
        services: { readonly characterService: CharacterService },
        options: { readonly ignoreArmorPenalties: boolean; readonly ignoreArmorSpeedPenalties: boolean },
    ): Array<Effect> {
        let itemEffects: Array<Effect> = [];

        const items = creature.inventories[0];

        items.armors.filter(armor => armor.equipped).forEach(armor => {
            itemEffects = itemEffects.concat(this._generateArmorEffects(armor, services, { creature }, options));
        });

        items.shields.filter(shield => shield.equipped).forEach(shield => {
            itemEffects = itemEffects.concat(this._generateShieldEffects(shield, services, { creature }));
        });

        return itemEffects;
    }

    private _applyUnburdenedIron(
        effects: Array<Effect>,
        services: { readonly characterService: CharacterService },
        context: { readonly character: CharacterModel },
    ): Array<Effect> {
        //If you have the Unburdened Iron feat and are taking speed penalties, reduce the first of them by 5.
        const lessenSpeedPenaltyEffect = (effect: Effect): void => {
            const speedPenaltyReduction = 5;

            effect.value = (parseInt(effect.value, 10) + speedPenaltyReduction).toString();

            if (!effect.value || !effect.value) {
                effect.apply = false;
                effect.source = `${ effect.source } (Cancelled by Unburdened Iron)`;
            } else {
                effect.source = `${ effect.source } (Lessened by Unburdened Iron)`;
            }
        };

        if (context.character.hasFeat('Unburdened Iron', services)) {
            let hasReducedOnePenalty = false;

            //Try global speed penalties first (this is more beneficial to the character).
            effects.forEach(effect => {
                if (!hasReducedOnePenalty && effect.target === 'Speed' && effect.penalty && !effect.toggle) {
                    hasReducedOnePenalty = true;
                    lessenSpeedPenaltyEffect(effect);
                }
            });
            effects.forEach(effect => {
                if (!hasReducedOnePenalty && effect.target === 'Land Speed' && effect.penalty && !effect.toggle) {
                    hasReducedOnePenalty = true;
                    lessenSpeedPenaltyEffect(effect);
                }
            });
        }

        return effects;
    }

    private _setEffectsIgnored(effects: Array<Effect>, context: { readonly creature: Creature }): Array<Effect> {
        //Reset ignoring all effects before processing ignored effects.
        effects.forEach(effect => {
            effect.ignored = false;
        });

        const isEffectIgnored = (effect: Effect): boolean => (
            context.creature.ignoredEffects
                .some(ignoredEffect =>
                    ignoredEffect.creature === effect.creature &&
                    ignoredEffect.target === effect.target &&
                    ignoredEffect.source === effect.source,
                )
        );

        //Ignore all effects that match the creature's ignoredEffects.
        effects.filter(effect => isEffectIgnored(effect)).forEach(effect => {
            effect.ignored = true;
        });
        //Cleanup the creature's ignoredEffects and delete each that doesn't match an existing effect.
        context.creature.ignoredEffects = context.creature.ignoredEffects
            .filter(ignoredEffect =>
                effects.some(effect =>
                    ignoredEffect.creature === effect.creature &&
                    ignoredEffect.target === effect.target &&
                    ignoredEffect.source === effect.source,
                ),
            );

        return effects;
    }

    private _setEffectsApplied(effects: Array<Effect>, context: { readonly creature: Creature }): Array<Effect> {
        //Toggle effects are always applied.
        effects.filter(effect => effect.toggle).forEach(effect => {
            effect.apply = true;
        });

        //On Familiars, item bonuses never apply.
        if (context.creature instanceof FamiliarModel) {
            effects.filter(effect => !effect.penalty && effect.type === 'item').forEach(effect => {
                effect.apply = false;
            });
        }

        //Now we need to go over all the effects.
        // If one target is affected by two bonuses of the same type, only the bigger one is applied.
        // The same goes for penalties, unless they are untyped.

        const targets: Array<string> = [];

        //Collect all targets of effects, but each only once
        effects.forEach(effect => {
            if (!targets.includes(effect.target)) {
                targets.push(effect.target);
            }
        });
        targets.forEach(target => {
            //Apply all untyped relative effects, but only the highest bonus and lowest penalty for each type for this target.
            //We only apply effects if the decision hasn't already been made (that is, if apply == undefined)
            this._effectsService
                .reduceEffectsByType(
                    effects.filter(effect =>
                        effect.target === target &&
                        effect.apply === undefined &&
                        effect.value,
                    ),
                )
                .forEach(effect => {
                    effect.apply = true;
                });
            //Apply only the highest absolute effect for each type for this target.
            // (There aren't any absolute penalties, and absolute effects are usually untyped.)
            this._effectsService
                .reduceEffectsByType(effects
                    .filter(effect =>
                        effect.target === target &&
                        effect.apply === undefined &&
                        effect.setValue,
                    ), { absolutes: true },
                )
                .forEach(effect => {
                    effect.apply = true;
                });
        });

        //Disable all effects that are not applied so far.
        effects.filter(effect => effect.apply === undefined).forEach(effect => {
            effect.apply = false;
        });

        //If an effect with the target "Ignore <type> bonuses and penalties" exists, all effects of that type are disabled.
        const doesIgnoreEffectExistsForType = (type: BonusTypes, effectType: string): boolean => (
            effects.some(effect =>
                !effect.ignored &&
                effect.target.toLowerCase() === `ignore ${ type.toLowerCase() } ${ effectType.toLowerCase() }`,
            )
        );

        Object.values(BonusTypes).forEach(type => {
            if (doesIgnoreEffectExistsForType(type, 'bonuses and penalties')) {
                effects.filter(effect => effect.type === type).forEach(effect => {
                    effect.apply = false;
                });
            }
        });

        const specificIgnoreEffectExists = (type: BonusTypes, effectType: string): boolean => (
            effects.some(effect =>
                !effect.ignored &&
                effect.target.toLowerCase().includes(`ignore ${ type.toLowerCase() } ${ effectType.toLowerCase() }`),
            )
        );

        //If there is an effect that says to ignore all <type> effects, bonuses or penalties [to a target],
        // all effects (or bonuses or penalties) to that target (or all targets) with that type are disabled.
        Object.values(BonusTypes).forEach(type => {
            effects
                .filter(effect =>
                    !effect.ignored &&
                    specificIgnoreEffectExists(type, 'effects') ||
                    specificIgnoreEffectExists(type, 'bonuses and penalties'),
                )
                .forEach(ignoreeffect => {
                    let target = 'all';

                    if (ignoreeffect.target.toLowerCase().includes(' to ')) {
                        target = ignoreeffect.target.toLowerCase().split(' to ')[1];
                    }

                    effects
                        .filter(effect =>
                            (
                                target === 'all' ||
                                effect.target.toLowerCase() === target
                            ) &&
                            effect.type.toLowerCase() === type.toLowerCase(),
                        )
                        .forEach(effect => {
                            effect.apply = false;
                        });
                });
            effects
                .filter(effect => !effect.ignored && specificIgnoreEffectExists(type, 'bonuses'))
                .forEach(ignoreeffect => {
                    let target = 'all';

                    if (ignoreeffect.target.toLowerCase().includes(' to ')) {
                        target = ignoreeffect.target.toLowerCase().split(' to ')[1];
                    }

                    effects
                        .filter(effect =>
                            (
                                target === 'all' ||
                                effect.target.toLowerCase() === target
                            ) &&
                            effect.type === type &&
                            !effect.penalty,
                        )
                        .forEach(effect => {
                            effect.apply = false;
                        });
                });
            effects
                .filter(effect => !effect.ignored && specificIgnoreEffectExists(type, 'penalties'))
                .forEach(ignoreeffect => {
                    let target = 'all';

                    if (ignoreeffect.target.toLowerCase().includes(' to ')) {
                        target = ignoreeffect.target.toLowerCase().split(' to ')[1];
                    }

                    effects
                        .filter(effect =>
                            (
                                target === 'all' ||
                                effect.target.toLowerCase() === target
                            ) &&
                            effect.type === type &&
                            effect.penalty,
                        )
                        .forEach(effect => {
                            effect.apply = false;
                        });
                });
        });
        //If an effect with the target "Ignore <name>" exists without a type, all effects of that name are disabled.
        effects
            .filter(effect =>
                !effect.ignored &&
                effect.target.toLowerCase().includes('ignore ') &&
                !Object.values(BonusTypes).some(type => effect.target.toLowerCase().includes(type.toLowerCase())),
            )
            .forEach(ignoreEffect => {
                const target = ignoreEffect.target.toLowerCase().replace('ignore ', '');

                effects.filter(effect => effect.target.toLowerCase() === target).forEach(effect => {
                    effect.apply = false;
                });
            });
        // If an effect with the target "Ignore absolute effects [on <name>]" exists without a type,
        // all absolute effects [on that target] are disabled.
        effects
            .filter(effect => !effect.ignored && effect.target.toLowerCase().includes('ignore absolute effects'))
            .forEach(ignoreeffect => {
                let target = 'all';

                if (ignoreeffect.target.toLowerCase().includes(' on ')) {
                    target = ignoreeffect.target.toLowerCase().split(' on ')[1];
                } else if (ignoreeffect.target.toLowerCase().includes(' to ')) {
                    target = ignoreeffect.target.toLowerCase().split(' to ')[1];
                }

                effects
                    .filter(effect =>
                        (
                            target === 'all' ||
                            effect.target.toLowerCase() === target
                        ) &&
                        effect.setValue,
                    )
                    .forEach(effect => {
                        effect.apply = false;
                    });
            });

        return effects;
    }

    private _setEffectsShown(effects: Array<Effect>): Array<Effect> {
        //Figure out whether to show or hide an effect if it isn't set already.
        const alwaysShow: Array<string> = [
            'AC',
            'Acrobatics',
            'Actions per Turn',
            'Agile Attack Rolls',
            'All Checks and DCs',
            'Arcana',
            'Athletics',
            'Attack Rolls',
            'Bulk',
            'Class DC',
            'Crafting',
            'Damage',
            'Damage Rolls',
            'Deception',
            'Diplomacy',
            'Expert Skill Checks',
            'Fortitude',
            'Hardness',
            'Intimidation',
            'Legendary Skill Checks',
            'Lore',
            'Master Skill Checks',
            'Max Dying',
            'Max HP',
            'Medicine',
            'Melee Attack Rolls',
            'Melee Damage',
            'Nature',
            'Non-Agile Attack Rolls',
            'Occultism',
            'Perception',
            'Performance',
            'Ranged Attack Rolls',
            'Ranged Damage',
            'Reach',
            'Reflex',
            'Religion',
            'Saving Throws',
            'Size',
            'Skill Checks',
            'Society',
            'Spell Attack Rolls',
            'Spell DCs',
            'Stealth',
            'Survival',
            'Thievery',
            'Trained Skill Checks',
            'Unarmed Attack Rolls',
            'Unarmed Damage',
            'Unarmed Damage per Die',
            'Untrained Skill Checks',
            'Weapon Damage per Die',
            'Will',
        ].map(name => name.toLowerCase());
        const alwaysShowWildcard: Array<string> = [
            'Extra Damage',
            'Resistance',
            'Immunity',
            'Ignore',
            'Speed',
            '-based Checks and DCs',
            '-based Skill Checks',
            'Lore: ',
        ].map(name => name.toLowerCase());

        effects
            .filter(effect => effect.show === undefined)
            .forEach(effect => {
                if (alwaysShow.includes(effect.target.toLowerCase())) {
                    effect.show = true;
                } else if (alwaysShowWildcard.some(wildcard => effect.target.toLowerCase().includes(wildcard))) {
                    effect.show = true;
                } else {
                    effect.show = false;
                }
            });

        return effects;
    }

    private _generateEffects(
        creatureType: CreatureTypes,
        services: { readonly characterService: CharacterService },
        options: { readonly secondRun?: boolean } = {},
    ): boolean {
        //This function generates effects for the targeted creature from any possible source that bears effects.
        //It is never called, except by this.initialize whenever the effects or the entire creature is updated.
        //The resulting effects are moved into the EffectsService and can be queried there.

        options = { secondRun: false, ...options };

        const creature: Creature = services.characterService.creatureFromType(creatureType);

        let effects: Array<Effect> = [];

        //Fetch any effects from the other creatures that apply to this.
        effects = effects.concat(this._effectsFromOtherCreatures(creature));

        // Generate effects from the creature and any applicable activities, abilities,
        // conditions or items that have an effects[] property or active hints.
        effects = effects.concat(this._generateObjectEffects(creature, services));

        // Generate effects that come from complex calculations based on properties of your equipped items.
        // This is not done for familiars, which don't apply item bonuses.
        // We need to take into account whether any previously generated effects could state
        // that armor penalties or armor speed penalties are ignored.

        //Skip all armor penalties if there is an "Ignore Armor Penalty" effect.
        const shouldIgnoreArmorPenalties =
            effects.some(effect =>
                effect.creature === creature.id &&
                effect.target === 'Ignore Armor Penalty' &&
                effect.toggle,
            );
        //Skip speed penalties if there is an "Ignore Armor Speed Penalty" effect.
        const shouldIgnoreArmorSpeedPenalties =
            effects.some(effect =>
                effect.creature === creature.id &&
                effect.target === 'Ignore Armor Speed Penalty' &&
                effect.toggle,
            );

        effects.push(
            ...this._generateCalculatedItemEffects(
                creature,
                services,
                { ignoreArmorPenalties: shouldIgnoreArmorPenalties, ignoreArmorSpeedPenalties: shouldIgnoreArmorSpeedPenalties },
            ),
        );

        //Apply any lessening of speed penalties that stems from a character's Unburdened Iron feat.
        if (creature instanceof CharacterModel) {
            effects = this._applyUnburdenedIron(effects, services, { character: creature });
        }

        //Split off effects that affect another creature for later. We don't want these to influence or be influenced by the next steps.
        const effectsForOthers = effects.filter(effect => effect.creature !== creature.id);

        effects = effects.filter(effect => effect.creature === creature.id);

        //Enable ignored on all effects that match the creature's ignored effects list.
        effects = this._setEffectsIgnored(effects, { creature });

        //Enable or disable applied on all effects according to various considerations.
        effects = this._setEffectsApplied(effects, { creature });

        //Enable or disable shown on all effects depending on whether they match a list of targets.
        effects = this._setEffectsShown(effects);

        //Add back the effects that affect another creature.
        effects = effects.concat(effectsForOthers);

        //Replace the global effects and rerun if needed or finish.
        return this._finishEffectsGeneration(effects, services, { creature }, options);
    }

    private _finishEffectsGeneration(
        effects: Array<Effect>,
        services: { readonly characterService: CharacterService },
        context: { readonly creature: Creature },
        options: { readonly secondRun?: boolean } = {},
    ): boolean {
        //Replace the global effects ONLY if the effects have changed, and if so, repeat the function straight away.
        //This ensures that any new strength bonuses get applied to any strength-based penalties,
        //and that the effects are always up to date and never need to be regenerated by any other process.
        //When the effects are unchanged after the second or any subsequent run, the generation is finished.

        const areEffectsChanged = (
            (JSON.stringify(this._effectsService.effects(context.creature.type).all)) !== (JSON.stringify(effects))
        );

        if (areEffectsChanged) {
            this._refreshService.prepareChangesByEffects(effects, this._effectsService.effects(context.creature.type).all, context);
            this._effectsService.replaceCreatureEffects(context.creature.type, effects);

            if (!services.characterService.stillLoading) {
                return this._generateEffects(context.creature.type, services, { secondRun: true });
            } else {
                return false;
            }
        } else if (options.secondRun) {
            return true;
        } else {
            //This stage is only reached if the effects were unchanged in the first run. No rerun is needed then.
            return false;
        }
    }

    private _runEffectGenerationPreflightUpdates(creature: Creature, services: { readonly characterService: CharacterService }): void {
        // Add or remove conditions depending on your equipment.
        // This is called here to ensure that the conditions exist before their effects are generated.
        this._conditionsService.generateBulkConditions(
            creature,
            { characterService: services.characterService },
        );
        this._conditionsService.generateItemGrantedConditions(
            creature,
            { characterService: services.characterService, effectsService: this._effectsService, itemsService: this._itemsService },
        );
        //Update item modifiers that influence their effectiveness and effects.
        this._updateItemModifiers(creature, services);
    }

    private _updateItemModifiers(creature: Creature, services: { readonly characterService: CharacterService }): void {
        // Update modifiers on all armors, shields and weapons that may influence the effects they generate.
        // We update weapons even though they don't generate effects with these modifiers,
        // because this is a good spot to keep them up to date.
        creature.inventories.forEach(inv => {
            inv.shields.forEach(shield => {
                shield.updateModifiers(creature, { characterService: services.characterService, refreshService: this._refreshService });
            });
            inv.weapons.forEach(weapon => {
                this._weaponPropertiesService.updateModifiers(weapon, creature);
            });
            inv.armors.forEach(armor => {
                this._armorPropertiesService.updateModifiers(armor, creature);
            });
        });
    }

    private _updateEffectsAndConditions(creatureType: CreatureTypes, services: { readonly characterService: CharacterService }): void {
        const creature: Creature = services.characterService.creatureFromType(creatureType);

        //Run certain non-effect updates that influence later effect generation.
        this._runEffectGenerationPreflightUpdates(creature, services);

        // Then generate effects for this creature. If anything has changed, update the language list length.
        // The language list is dependent on effects, so needs to run directly afterwards.
        const areEffectsChanged = this._generateEffects(creatureType, services);

        if (areEffectsChanged) {
            services.characterService.updateLanguageList();
        }

        //Process all prepared onceEffects.
        services.characterService.processPreparedOnceEffects();
        //Process all prepared changes or changes that were skipped previously.
        this._refreshService.processPreparedChanges();
    }

}
