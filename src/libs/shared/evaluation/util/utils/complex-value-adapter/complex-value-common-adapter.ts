import { DomainValueAdapter } from '../domain-value-adapter/domain-value-adapter';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import {
    ComplexValueArithmetic,
    ComplexValueContext,
    ComplexValueExact,
    ComplexValueListIndex,
    ComplexValueMeetsAll,
    ComplexValueMeetsAny,
    ComplexValueResult,
    DualArithmeticValue,
    MultiArithmeticValue,
} from '../../models/complex-value';
import { computed, signal, Signal } from '@angular/core';
import { weaklyCachedSignalWithKey } from 'src/libs/shared/common/util/utils/cache-utils';
import {
    isComplexValueArithmetic,
    isComplexValueExact,
    isComplexValueListIndex,
    isComplexValueMeetsAll,
    isComplexValueMeetsAny,
    isDomainValueAbilityModifiers,
    isDomainValueCharacterLevel,
    isDomainValueCountAncestries,
    isDomainValueCountBackgrounds,
    isDomainValueCountClasses,
    isDomainValueCountClassSpellcastings,
    isDomainValueCountDeities,
    isDomainValueCountFavoredWeapons,
    isDomainValueCountFeats,
    isDomainValueCountHeritages,
    isDomainValueCountLearnedSpells,
    isDomainValueCountLores,
    isDomainValueCountSenses,
    isDomainValueCountSpeeds,
    isDomainValueCountSpells,
    isDomainValueHasAlignment,
    isDomainValueHasAnimalCompanion,
    isDomainValueHasFamiliar,
    isDomainValueSkillLevels,
    isDualArithmeticValue,
    isMultiArithmeticValue,
} from '../complex-value-type-utils';
import { DomainValueCommonAdapter } from '../domain-value-common-adapter/domain-value-common-adapter';

const splitNamesFn = <CTX extends ComplexValueContext>(list: string, _context: CTX): Array<string> => Array.from(new Set(
    list
        .split(',')
        .map(name => name.trim()),
));

type ResolverFn<CV extends object, CTX extends ComplexValueContext> = (
    complexValue: CV,
    context: CTX
) => Signal<ComplexValueResult> | undefined;

const successSignal = signal({ met: true, value: 0 }).asReadonly();
const failSignal = signal({ met: false, value: 0 }).asReadonly();

const keyFromContext = (context: ComplexValueContext): string =>
    `charLevel=${ context.charLevel }`
    + `&excludeTemporary=${ context.excludeTemporary }`;

export class ComplexValueCommonAdapter<ComplexValueExt extends object, CTX extends ComplexValueContext> {

    private readonly _domainValueAdapter: DomainValueAdapter<ComplexValueExt, CTX>;
    private readonly _domainValueCommonAdapter: DomainValueCommonAdapter<ComplexValueExt, CTX>;

    private readonly _cache = {
        resolveComplexValue: new WeakMap<ComplexValueExt, Map<string, Signal<ComplexValueResult>>>(),
        resolveMeetsAll: new WeakMap<ComplexValueMeetsAll<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveMeetsAny: new WeakMap<ComplexValueMeetsAny<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveDualArithmetic: new WeakMap<DualArithmeticValue<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveMultiArithmetic: new WeakMap<MultiArithmeticValue<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
        resolveListIndex: new WeakMap<ComplexValueListIndex<ComplexValueExt>, Map<string, Signal<ComplexValueResult>>>(),
    };

    private readonly _complexValueResolvers: Array<ResolverFn<ComplexValueExt, CTX>> = [
        v => isComplexValueExact(v) ? this._resolveExact$$(v) : undefined,
        (v, c) => isComplexValueMeetsAll<ComplexValueExt>(v) ? this._resolveMeetsAll$$(v, c) : undefined,
        (v, c) => isComplexValueMeetsAny<ComplexValueExt>(v) ? this._resolveMeetsAny$$(v, c) : undefined,
        (v, c) => isComplexValueArithmetic<ComplexValueExt>(v) ? this._resolveArithmetic$$(v, c) : undefined,
        (v, c) => isComplexValueListIndex<ComplexValueExt>(v) ? this._resolveListIndex$$(v, c) : undefined,
        (v, c) => isDomainValueCharacterLevel<ComplexValueExt>(v) ? this._domainValueAdapter.resolveCharacterLevel$$(v, c) : undefined,
        (v, c) => isDomainValueHasAlignment<ComplexValueExt>(v) ? this._domainValueAdapter.resolveHasAlignment$$(v, c) : undefined,
        (v, c) =>
            isDomainValueHasAnimalCompanion<ComplexValueExt>(v) ? this._domainValueAdapter.resolveHasAnimalCompanion$$(v, c) : undefined,
        (v, c) => isDomainValueHasFamiliar<ComplexValueExt>(v) ? this._domainValueAdapter.resolveHasFamiliar$$(v, c) : undefined,
        (v, c) => isDomainValueCountAncestries<ComplexValueExt>(v) ? this._domainValueAdapter.resolveCountAncestries$$(v, c) : undefined,
        (v, c) => isDomainValueCountBackgrounds<ComplexValueExt>(v) ? this._domainValueAdapter.resolveCountBackgrounds$$(v, c) : undefined,
        (v, c) => isDomainValueCountClasses<ComplexValueExt>(v) ? this._domainValueAdapter.resolveCountClasses$$(v, c) : undefined,
        (v, c) =>
            isDomainValueCountClassSpellcastings<ComplexValueExt>(v)
                ? this._domainValueAdapter.resolveCountClassSpellCastings$$(v, c)
                : undefined,
        (v, c) => isDomainValueCountDeities<ComplexValueExt>(v) ? this._domainValueAdapter.resolveCountDeities$$(v, c) : undefined,
        (v, c) =>
            isDomainValueCountFavoredWeapons<ComplexValueExt>(v) ? this._domainValueAdapter.resolveCountFavoredWeapons$$(v, c) : undefined,
        (v, c) => isDomainValueCountFeats<ComplexValueExt>(v) ? this._domainValueAdapter.resolveCountFeats$$(v, c) : undefined,
        (v, c) => isDomainValueCountHeritages<ComplexValueExt>(v) ? this._domainValueAdapter.resolveCountHeritages$$(v, c) : undefined,
        (v, c) =>
            isDomainValueCountLearnedSpells<ComplexValueExt>(v) ? this._domainValueAdapter.resolveCountLearnedSpells$$(v, c) : undefined,
        (v, c) => isDomainValueCountLores<ComplexValueExt>(v) ? this._domainValueAdapter.resolveCountLores$$(v, c) : undefined,
        (v, c) => isDomainValueCountSenses<ComplexValueExt>(v) ? this._domainValueAdapter.resolveCountSenses$$(v, c) : undefined,
        (v, c) => isDomainValueCountSpeeds<ComplexValueExt>(v) ? this._domainValueAdapter.resolveCountSpeeds$$(v, c) : undefined,
        (v, c) => isDomainValueCountSpells<ComplexValueExt>(v) ? this._domainValueAdapter.resolveCountSpells$$(v, c) : undefined,
        (v, c) => isDomainValueSkillLevels<ComplexValueExt>(v) ? this._domainValueAdapter.resolveSkillLevels$$(v, c) : undefined,
        (v, c) => isDomainValueAbilityModifiers<ComplexValueExt>(v) ? this._domainValueAdapter.resolveAbilityModifiers$$(v, c) : undefined,
    ];

    constructor(
        recastFns: RecastFns,
        private readonly _resolveChildValue$$: (
            cv: ComplexValueExt, ctx: CTX
        ) => Signal<ComplexValueResult> = this.resolveComplexValue$$.bind(this),
        splitNames: (list: string, context: CTX) => Array<string> = splitNamesFn,
    ) {
        this._domainValueAdapter = new DomainValueAdapter(recastFns, _resolveChildValue$$, splitNames);
        this._domainValueCommonAdapter = new DomainValueCommonAdapter(_resolveChildValue$$, splitNames);
    }

    public resolveComplexValue$$(
        complexValue: ComplexValueExt,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const resolver$$ = computed(() => {
                    for (const tryResolver of this._complexValueResolvers) {
                        const resolver = tryResolver(
                            complexValue,
                            context,
                        );

                        if (resolver) {
                            return resolver;
                        }
                    }

                    return failSignal;
                });

                return computed(() => resolver$$()());
            },
            { store: this._cache.resolveComplexValue, objKey: complexValue, key: keyFromContext(context) },
        );
    }

    private _resolveExact$$(complexValue: ComplexValueExact): Signal<ComplexValueResult> {
        return signal({ met: true, value: complexValue.exact }).asReadonly();
    }

    private _resolveMeetsAll$$(
        complexValue: ComplexValueMeetsAll<ComplexValueExt>,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const results$$ = complexValue.meetsAll.map(value => this._resolveChildValue$$(value, context));

                const result$$ = computed(() => {
                    const results = results$$.map(resolution$$ => resolution$$());

                    if (results.every(({ met }) => met)) {
                        if (complexValue.useFirstAsValue) {
                            return signal({ met: true, value: results[0]?.value ?? 0 });
                        }

                        if (complexValue.useValue) {
                            return this._resolveChildValue$$(complexValue.useValue, context);
                        }

                        return successSignal;
                    }

                    return failSignal;
                });

                return computed(() => result$$()());
            },
            { store: this._cache.resolveMeetsAll, objKey: complexValue, key: keyFromContext(context) },
        );
    }

    private _resolveMeetsAny$$(
        complexValue: ComplexValueMeetsAny<ComplexValueExt>,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const results$$ = complexValue.meetsAny.map(value => this._resolveChildValue$$(value, context));

                const result$$ = computed(() => {
                    const results = results$$.map(resolved$$ => resolved$$());

                    for (const result of results) {
                        if (result.met) {
                            if (complexValue.useFirstAsValue) {
                                return signal(result).asReadonly();
                            }

                            if (complexValue.useValue) {
                                return this._resolveChildValue$$(complexValue.useValue, context);
                            }

                            return successSignal;
                        }
                    }

                    return failSignal;
                });

                return computed(() => result$$()());
            },
            { store: this._cache.resolveMeetsAny, objKey: complexValue, key: keyFromContext(context) },
        );
    }

    private _resolveArithmetic$$(
        complexValue: ComplexValueArithmetic<ComplexValueExt>,
        context: CTX,
    ): Signal<ComplexValueResult> {
        const arithmetic = complexValue.arithmetic;

        if (isDualArithmeticValue(arithmetic)) {
            return this._resolveDualArithmetic$$(arithmetic, context);
        }

        if (isMultiArithmeticValue(arithmetic)) {
            return this._resolveMultiArithmetic$$(arithmetic, context);
        }

        return failSignal;
    }

    private _resolveDualArithmetic$$(
        arithmetic: DualArithmeticValue<ComplexValueExt>,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const leftResult$$ = this._resolveChildValue$$(arithmetic.leftValue, context);
                const rightResult$$ = this._resolveChildValue$$(arithmetic.rightValue, context);

                const value$$ = computed(() => {
                    const leftResult = leftResult$$();
                    const rightResult = rightResult$$();

                    let value = 0;

                    if (arithmetic.operator === '-') {
                        value = leftResult.value - rightResult.value;
                    }

                    if (arithmetic.operator === '/') {
                        value = leftResult.value / rightResult.value;
                    }

                    if (arithmetic.rounding === 'down') {
                        value = Math.floor(value);
                    }

                    if (arithmetic.rounding === 'up') {
                        value = Math.ceil(value);
                    }

                    return value;
                });

                return this._domainValueCommonAdapter.getValueResult$$(
                    value$$,
                    arithmetic,
                    context,
                );
            },
            { store: this._cache.resolveDualArithmetic, objKey: arithmetic, key: keyFromContext(context) },
        );
    }

    private _resolveMultiArithmetic$$(
        arithmetic: MultiArithmeticValue<ComplexValueExt>,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const results$$ = arithmetic.values.map(value => this._resolveChildValue$$(value, context));

                const value$$ = computed(() => {
                    const results = results$$.map(result$$ => result$$());

                    let value = 0;

                    if (!results.length) {
                        return value;
                    }

                    if (arithmetic.operator === '+') {
                        value = results.reduce((total, resultValue) => total + resultValue.value, 0);
                    }

                    if (arithmetic.operator === '*') {
                        value = results.reduce((total, resultValue) => total * resultValue.value, 1);
                    }

                    if (arithmetic.operator === 'max') {
                        value = Math.max(...results.map(result => result.value));
                    }

                    if (arithmetic.operator === 'min') {
                        value = Math.min(...results.map(result => result.value));
                    }

                    if (arithmetic.rounding === 'down') {
                        value = Math.floor(value);
                    }

                    if (arithmetic.rounding === 'up') {
                        value = Math.ceil(value);
                    }

                    return value;
                });

                return this._domainValueCommonAdapter.getValueResult$$(
                    value$$,
                    arithmetic,
                    context,
                );
            },
            { store: this._cache.resolveMultiArithmetic, objKey: arithmetic, key: keyFromContext(context) },
        );
    }

    private _resolveListIndex$$(
        listIndex: ComplexValueListIndex<ComplexValueExt>,
        context: CTX,
    ): Signal<ComplexValueResult> {
        return weaklyCachedSignalWithKey(
            () => {
                const results$$ = listIndex.list.map(value => this._resolveChildValue$$(value, context));
                const index$$ = this._resolveChildValue$$(listIndex.index, context);
                const fallback$$ = listIndex.fallBack
                    ? this._resolveChildValue$$(listIndex.fallBack, context)
                    : signal({ met: false, value: 0 });

                const value$$ = computed(() => {
                    const results = results$$.map(result$$ => result$$());
                    const index = index$$();

                    return results[index.value]?.value ?? fallback$$().value;
                });

                return this._domainValueCommonAdapter.getValueResult$$(
                    value$$,
                    listIndex,
                    context,
                );
            },
            { store: this._cache.resolveListIndex, objKey: listIndex, key: keyFromContext(context) },
        );
    }
}
