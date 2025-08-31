import { computed, Signal } from '@angular/core';
import { weaklyCachedSignalWithKey } from 'src/libs/shared/common/util/utils/cache-utils';
import { ComplexValueResult, DomainValueBasicProps } from 'src/libs/shared/evaluation/util/models/complex-value';
import { ComplexValueCommonAdapter } from 'src/libs/shared/evaluation/util/utils/complex-value-adapter/complex-value-common-adapter';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import {
    ComplexSpellChoiceValue,
    ComplexSpellChoiceValueChoiceAvailable,
    ComplexSpellChoiceValueChoiceLevel,
    ComplexSpellChoiceValueContext,
    ComplexSpellChoiceValueHighestSpellLevelOfCasting,
} from '../../models/complex-spell-choice-value';
import { isComplexSpellChoiceValueChoiceAvailable, isComplexSpellChoiceValueChoiceLevel } from '../complex-spell-choice-value-type-utils';
import { SpellChoice } from '../../models/spell-choice';
import { DomainValueCommonAdapter } from 'src/libs/shared/evaluation/util/utils/domain-value-common-adapter/domain-value-common-adapter';

interface SpellChoiceEvaluationCache {
    resolveChoiceLevel: WeakMap<ComplexSpellChoiceValueChoiceLevel<ComplexSpellChoiceValue>, Map<string, Signal<ComplexValueResult>>>;
    resolveHighestSpellLevelOfCasting:
    WeakMap<ComplexSpellChoiceValueHighestSpellLevelOfCasting<ComplexSpellChoiceValue>, Map<string, Signal<ComplexValueResult>>>;
    resolveChoiceAvailable:
    WeakMap<ComplexSpellChoiceValueChoiceAvailable<ComplexSpellChoiceValue>, Map<string, Signal<ComplexValueResult>>>;
}

const keyFromContext = (context: ComplexSpellChoiceValueContext): string =>
    `charLevel=${ context.charLevel }`
    + `&highestSpellLevelOfCasting=${ context.highestSpellLevelOfCasting }`
    + `&excludeTemporary=${ context.excludeTemporary }`;

export class ComplexSpellChoiceValueAdapter {

    private readonly _cache = {
        choice: new WeakMap<SpellChoice, SpellChoiceEvaluationCache>(),
    };

    private readonly _complexValueCommonAdapter: ComplexValueCommonAdapter<ComplexSpellChoiceValue, ComplexSpellChoiceValueContext>;
    private readonly _domainValueCommonAdapter: DomainValueCommonAdapter<ComplexSpellChoiceValue, ComplexSpellChoiceValueContext>;

    constructor(
        recastFns: RecastFns,
    ) {
        this._complexValueCommonAdapter = new ComplexValueCommonAdapter(recastFns, this.resolveComplexSpellChoiceValue$$.bind(this));
        this._domainValueCommonAdapter = new DomainValueCommonAdapter(this.resolveComplexSpellChoiceValue$$.bind(this));
    }

    public resolveComplexSpellChoiceValue$$(
        spellChoiceValue: ComplexSpellChoiceValue,
        context: ComplexSpellChoiceValueContext,
    ): Signal<ComplexValueResult> {
        if (isComplexSpellChoiceValueChoiceLevel(spellChoiceValue)) {
            return this.resolveChoiceLevel$$(spellChoiceValue, context);
        }

        if (isComplexSpellChoiceValueChoiceAvailable(spellChoiceValue)) {
            return this.resolveChoiceAvailable$$(spellChoiceValue, context);
        }

        return this._complexValueCommonAdapter.resolveComplexValue$$(spellChoiceValue, context);
    }

    public resolveChoiceLevel$$(
        spellChoiceValue: ComplexSpellChoiceValueChoiceLevel<ComplexSpellChoiceValue> & DomainValueBasicProps,
        context: ComplexSpellChoiceValueContext,
    ): Signal<ComplexValueResult> {
        return this._cachedSpellChoiceEvaluation(
            context.choice,
            cache => weaklyCachedSignalWithKey(
                () => {
                    const choiceLevel = spellChoiceValue.choiceLevel;

                    const met$$ = this._domainValueCommonAdapter.doesNumberMatchExpectation$$(
                        context.choice.level,
                        choiceLevel.expected,
                        context,
                    );

                    const parametersValue$$ = computed(() =>
                        this._domainValueCommonAdapter.getParametersValue$$(
                            { met: met$$(), value: context.charLevel },
                            choiceLevel,
                            context,
                        ),
                    );

                    return computed(() => parametersValue$$()());
                },
                { store: cache.resolveChoiceLevel, objKey: spellChoiceValue, key: keyFromContext(context) },
            ),
        );
    }

    public resolveChoiceAvailable$$(
        spellChoiceValue: ComplexSpellChoiceValueChoiceAvailable<ComplexSpellChoiceValue> & DomainValueBasicProps,
        context: ComplexSpellChoiceValueContext,
    ): Signal<ComplexValueResult> {
        return this._cachedSpellChoiceEvaluation(
            context.choice,
            cache => weaklyCachedSignalWithKey(
                () => {
                    const choiceAvailable = spellChoiceValue.choiceAvailable;

                    const met$$ = this._domainValueCommonAdapter.doesNumberMatchExpectation$$(
                        context.choice.available,
                        choiceAvailable.expected,
                        context,
                    );

                    const parametersValue$$ = computed(() =>
                        this._domainValueCommonAdapter.getParametersValue$$(
                            { met: met$$(), value: context.charLevel },
                            choiceAvailable,
                            context,
                        ),
                    );

                    return computed(() => parametersValue$$()());
                },
                { store: cache.resolveChoiceAvailable, objKey: spellChoiceValue, key: keyFromContext(context) },
            ),
        );
    }

    public resolveHighestSpellLevelOfCasting$$(
        spellChoiceValue: ComplexSpellChoiceValueHighestSpellLevelOfCasting<ComplexSpellChoiceValue> & DomainValueBasicProps,
        context: ComplexSpellChoiceValueContext,
    ): Signal<ComplexValueResult> {
        return this._cachedSpellChoiceEvaluation(
            context.choice,
            cache => weaklyCachedSignalWithKey(
                () => {
                    const highestSpellLevelOfCasting = spellChoiceValue.highestSpellLevelOfCasting;

                    const met$$ = this._domainValueCommonAdapter.doesNumberMatchExpectation$$(
                        context.highestSpellLevelOfCasting,
                        highestSpellLevelOfCasting.expected,
                        context,
                    );

                    const parametersValue$$ = computed(() =>
                        this._domainValueCommonAdapter.getParametersValue$$(
                            { met: met$$(), value: context.highestSpellLevelOfCasting },
                            highestSpellLevelOfCasting,
                            context,
                        ),
                    );

                    return computed(() => parametersValue$$()());
                },
                { store: cache.resolveHighestSpellLevelOfCasting, objKey: spellChoiceValue, key: keyFromContext(context) },
            ),
        );
    }

    private _cachedSpellChoiceEvaluation<T>(
        choice: SpellChoice,
        sourceFn: (choiceCache: SpellChoiceEvaluationCache) => Signal<T>,
    ): Signal<T> {
        let featCache = this._cache.choice.get(choice);

        if (!featCache) {
            featCache = {
                resolveChoiceLevel:
                    new WeakMap<ComplexSpellChoiceValueChoiceLevel<ComplexSpellChoiceValue>, Map<string, Signal<ComplexValueResult>>>(),
                resolveHighestSpellLevelOfCasting:
                    // eslint-disable-next-line max-len
                    new WeakMap<ComplexSpellChoiceValueHighestSpellLevelOfCasting<ComplexSpellChoiceValue>, Map<string, Signal<ComplexValueResult>>>(),
                resolveChoiceAvailable:
                    new WeakMap<ComplexSpellChoiceValueChoiceAvailable<ComplexSpellChoiceValue>, Map<string, Signal<ComplexValueResult>>>(),
            };

            this._cache.choice.set(choice, featCache);
        }

        return sourceFn(featCache);
    }
}
