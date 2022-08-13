import { Injectable } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { Effect } from 'src/app/classes/Effect';
import { EffectGain } from 'src/app/classes/EffectGain';
import { EvaluationService } from 'src/libs/shared/services/evaluation/evaluation.service';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { Item } from 'src/app/classes/Item';
import { Material } from 'src/app/classes/Material';
import { WornItem } from 'src/app/classes/WornItem';
import { BonusTypes } from 'src/libs/shared/definitions/bonusTypes';

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
export class ObjectEffectsGenerationService {

    constructor(
        private readonly _evaluationService: EvaluationService,
        private readonly _characterService: CharacterService,
    ) { }

    public effectsFromEffectObject(
        object: EffectObject,
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

        //EffectGains come with values that contain a statement.
        //This statement is evaluated by the EvaluationService and then validated here in order to build a working Effect.
        object.effects
            .filter(effectGain =>
                effectGain.resonant
                    ? (object instanceof WornItem && object.isSlottedAeonStone)
                    : true,
            ).forEach((effectGain: EffectGain) => {
                let shouldShowEffect: boolean = effectGain.show;
                let type: string = BonusTypes.Untyped;
                let isPenalty = false;

                let isToggledEffect: boolean = effectGain.toggle;

                if (object === context.creature) {
                    source = effectGain.source || 'Custom Effect';
                }

                if (effectGain.type) {
                    type = effectGain.type;
                }

                const { setValue, value, valueNumber } =
                    this._determineEffectValue(effectGain, source, context, options);

                if (setValue) {
                    isPenalty = false;
                } else {
                    //Negative values are penalties unless Bulk is affected.
                    isPenalty = (valueNumber < 0) === (effectGain.affected !== 'Bulk');
                }

                if (effectGain.conditionalToggle) {
                    try {
                        isToggledEffect =
                            !!this._evaluationService.valueFromFormula(
                                effectGain.conditionalToggle,
                                { ...context, effect: effectGain, effectSourceName: source },
                                options,
                            ).toString();
                    } catch (error) {
                        isToggledEffect = false;
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

                const { targetCreature, targetValue } = this._determineEffectTarget(effectGain, context);

                const sourceId = this._determineEffectSource(context);

                const title = this._determineEffectTitle(effectGain, { value, setValue }, { ...context, source }, options);

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
                                creature: targetCreature,
                                type,
                                target: targetValue,
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

    private _determineEffectValue(
        effectGain: EffectGain,
        source: string,
        context: EffectContext,
        options: EffectOptions,
    ): { value: string; setValue: string; valueNumber: number } {
        let valueNumber = 0;
        let value = '';
        let setValue = '';

        try {
            valueNumber = this._evaluationService.valueFromFormula(
                effectGain.value,
                { ...context, effect: effectGain, effectSourceName: source },
                options,
            ) as number;

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
                setValue = this._evaluationService.valueFromFormula(
                    effectGain.setValue,
                    { ...context, effect: effectGain, effectSourceName: source },
                    options,
                ).toString();
            } catch (error) {
                setValue = '';
            }
        }

        if (setValue) {
            value = '0';
        }

        return { value, setValue, valueNumber };
    }

    private _determineEffectSource(
        context: {
            object?: EffectObject;
            parentConditionGain?: ConditionGain;
            parentItem?: Item | Material;
        },
    ): string {
        if (context.parentConditionGain) {
            return context.parentConditionGain.id;
        } else if (context.parentItem instanceof Item) {
            return context.parentItem.id;
        } else if (context.object instanceof Creature) {
            return context.object.id;
        }

        return '';
    }

    private _determineEffectTarget(
        effectGain: EffectGain,
        context: { creature: Creature },
    ): { targetCreature: string; targetValue: string } {
        //Effects can affect another creature. In that case, remove the notation and change the target.
        let targetCreature: string = context.creature.id;
        let targetValue: string = effectGain.affected;

        if (effectGain.affected.includes('Character:')) {
            targetCreature = this._characterService.character.id || '';
            targetValue = effectGain.affected.replace('Character:', '');
        }

        if (effectGain.affected.includes('Companion:')) {
            targetCreature = this._characterService.companion?.id || '';
            targetValue = effectGain.affected.replace('Companion:', '');
        }

        if (effectGain.affected.includes('Familiar:')) {
            targetCreature = this._characterService.familiar?.id || '';
            targetValue = effectGain.affected.replace('Familiar:', '');
        }

        return { targetCreature, targetValue };
    }

    private _determineEffectTitle(
        effectGain: EffectGain,
        values: { value: string; setValue: string },
        context: EffectContext & { source: string },
        options: EffectOptions,
    ): string {
        let title = '';

        if (effectGain.title) {
            try {
                //We insert value and setValue here (if needed) because they will not be available in the evaluation.
                const testTitle =
                    effectGain.title
                        .replace(/(^|[^\w])value($|[^\w])/g, `$1${ values.value }$2`)
                        .replace(/(^|[^\w])setValue($|[^\w])/g, `$1${ values.setValue }$2`);

                title = this._evaluationService.valueFromFormula(
                    testTitle,
                    { ...context, effect: effectGain, effectSourceName: context.source },
                    options,
                ).toString();
            } catch (error) {
                title = '';
            }
        }

        return title;
    }

}
