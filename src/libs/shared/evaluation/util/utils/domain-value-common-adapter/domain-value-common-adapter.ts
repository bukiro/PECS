import { Signal, signal, computed } from '@angular/core';
import { matchFlagFilter } from 'src/libs/shared/common/util/utils/filter-utils';
import { stringsIncludeCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import {
    ComplexValueContext,
    CountBasicQuery,
    BooleanExpectation,
    ValueExpectation,
    ComplexValueResult,
    DomainValueParameters,
    ListDomainValueParameters,
} from '../../models/complex-value';
import { isEqualPrimitiveObject } from 'src/libs/shared/common/util/utils/compare-utils';

const splitNamesFn = <CTX extends ComplexValueContext>(list: string, _context: CTX): Array<string> => Array.from(new Set(
    list
        .split(',')
        .map(name => name.trim()),
));

const trueSignal = signal(true).asReadonly();
const falseSignal = signal(false).asReadonly();

export class DomainValueCommonAdapter<CV, CTX extends ComplexValueContext> {
    constructor(
        private readonly _resolveChildValue$$: (cv: CV, context: CTX) => Signal<ComplexValueResult>,
        private readonly _splitNames: (list: string, context: CTX) => Array<string> = splitNamesFn,
    ) { }

    /**
     * By default, a complex requirement query either the any, name, anyOfNames, allOfNames or anyNotOfNames parameter.
     * This returns the amount of members in the given list that match this parameter.
     *
     * @param query The query to match
     * @param list The list that should match the query
     * @returns
     */
    public applyCountBasicQuery(
        query: CountBasicQuery | undefined,
        list: Array<string>,
        context: CTX,
    ): number {
        if (!query) {
            return list.length;
        }

        // name is always an alias for anyOfNames
        const anyOfNames = query.name ?? query.anyOfNames;

        // Using `any` just means the whole list is counted.
        // If the list has no members, the count is 0, which equals "any" not being matched.
        if (query.any) {
            return list.length;
        } else if (query.allOfNames) {
            const names = this._splitNames(query.allOfNames, context);

            return names.every(name => stringsIncludeCaseInsensitive(list, name)) && list.length || 0;
        } else if (anyOfNames) {
            const names = this._splitNames(anyOfNames, context);

            return names.filter(name => stringsIncludeCaseInsensitive(list, name)).length;
        } else if (query.anyNotOfNames) {
            const names = this._splitNames(query.anyNotOfNames, context);

            return list.filter(name => !stringsIncludeCaseInsensitive(names, name)).length;
        } else {
            return list.length;
        }
    }

    public doesNumberMatchBooleanExpectation(
        number: number,
        expectation?: BooleanExpectation,
    ): boolean {
        // If no expectation is given, return true, so the value can be used.
        if (!expectation) {
            return true;
        }

        return (
            matchFlagFilter({ value: !!number, flag: expectation.isTrue })
            && matchFlagFilter({ value: !number, flag: expectation.isFalse })
        );
    }

    public doesNumberMatchExpectation$$(
        number: number,
        expectation: ValueExpectation<CV> | undefined,
        context: CTX,
    ): Signal<boolean> {
        // If no expectation is given, return true, so the value can be used.
        if (!expectation) {
            return trueSignal;
        }

        if (expectation.isTrue || expectation.isFalse) {
            return this.doesNumberMatchBooleanExpectation(number, expectation)
                ? trueSignal
                : falseSignal;
        }

        if (expectation.isEqual) {
            const comparedValue$$ = this._resolveChildValue$$(expectation.isEqual, context);

            return computed(() =>
                number === comparedValue$$().value,
            );
        }

        if (expectation.isGreaterThan) {
            const comparedValue$$ = this._resolveChildValue$$(expectation.isGreaterThan, context);

            return computed(() =>
                number > comparedValue$$().value,
            );
        }

        if (expectation.isLesserThan) {
            const comparedValue$$ = this._resolveChildValue$$(expectation.isLesserThan, context);

            return computed(() =>
                number < comparedValue$$().value,
            );
        }

        return number ? trueSignal : falseSignal;
    }

    public doesNumberListMatchBooleanExpectation(
        numberList: Array<number>,
        query: CountBasicQuery | undefined,
        expectation?: BooleanExpectation,
    ): boolean {
        const operator = query?.allOfNames ? Array.prototype.every : Array.prototype.some;

        // If no expectation is given, return true, so the value can be used.
        if (!expectation) {
            return true;
        }

        return (
            matchFlagFilter({ value: operator.call(numberList, number => !!number), flag: expectation.isTrue })
            && matchFlagFilter({ value: operator.call(numberList, number => !number), flag: expectation.isFalse })
        );
    }

    public doesNumberListMatchExpectation$$(
        numberList: Array<number>,
        query: CountBasicQuery | undefined,
        expectation: ValueExpectation<CV> | undefined,
        context: CTX,
    ): Signal<boolean> {
        const operator = query?.allOfNames ? Array.prototype.every : Array.prototype.some;

        // If no expectation is given, return true, so the value can be used.
        if (!expectation) {
            return trueSignal;
        }

        if (expectation.isTrue || expectation.isFalse) {
            return this.doesNumberListMatchBooleanExpectation(numberList, query, expectation)
                ? trueSignal
                : falseSignal;
        }

        if (expectation.isEqual) {
            const comparedValue$$ = this._resolveChildValue$$(expectation.isEqual, context);

            return computed(() => {
                const comparedValue = comparedValue$$().value;

                return operator.call(numberList, (number: number) => number === comparedValue);
            });
        }

        if (expectation.isGreaterThan) {
            const comparedValue$$ = this._resolveChildValue$$(expectation.isGreaterThan, context);

            return computed(() => {
                const comparedValue = comparedValue$$().value;

                return operator.call(numberList, (number: number) => number > comparedValue);
            });
        }

        if (expectation.isLesserThan) {
            const comparedValue$$ = this._resolveChildValue$$(expectation.isLesserThan, context);

            return computed(() => {
                const comparedValue = comparedValue$$().value;

                return operator.call(numberList, (number: number) => number < comparedValue);
            });
        }

        return numberList.length ? trueSignal : falseSignal;
    }

    public getParametersValue$$(
        { met, value }: ComplexValueResult,
        parameters: DomainValueParameters<CV>,
        context: CTX,
    ): Signal<ComplexValueResult> {
        if (met) {
            if (parameters.useValue) {
                return this._resolveChildValue$$(parameters.useValue, context);
            }

            // If no other option is set, useAsValue is used as the default.
            return signal({
                met,
                value,
            }).asReadonly();
        }

        if (parameters.fallBack) {
            return this._resolveChildValue$$(parameters.fallBack, context);
        }

        return signal({
            met,
            value: 0,
        }).asReadonly();
    }

    public getListParametersValue$$(
        { met, values }: { met: boolean; values: Array<number> },
        parameters: ListDomainValueParameters<CV>,
        context: CTX,
    ): Signal<ComplexValueResult> {
        if (met) {
            if (parameters.useValue) {
                return this._resolveChildValue$$(parameters.useValue, context);
            }

            if (parameters.useLowestAsValue && values.length) {
                return signal({
                    met,
                    value: Math.min(...values),
                }).asReadonly();
            }

            // The highest value is used by default if no other option is given and there are any results.
            // useHighestAsValue and useAsValue have the same function in a list.
            if (values.length) {
                return signal({
                    met,
                    value: Math.max(...values),
                }).asReadonly();
            }
        }

        if (parameters.fallBack) {
            return this._resolveChildValue$$(parameters.fallBack, context);
        }

        return signal({
            met,
            value: 0,
        }).asReadonly();
    }

    public getValueResult$$(
        queryResult$$: Signal<number>,
        parameters: DomainValueParameters<CV>,
        context: CTX,
    ): Signal<ComplexValueResult> {
        const met$$ = computed(() => this.doesNumberMatchExpectation$$(queryResult$$(), parameters.expected, context));

        const parametersValue$$ = computed(() =>
            this.getParametersValue$$({ met: met$$()(), value: queryResult$$() }, parameters, context),
        );

        return computed(() => parametersValue$$()(), { equal: isEqualPrimitiveObject });
    }

    public getValueListResult$$(
        queryResult$$: Signal<Array<number>>,
        parameters: ListDomainValueParameters<CV>,
        context: CTX,
    ): Signal<ComplexValueResult> {
        const met$$ = computed(() =>
            this.doesNumberListMatchExpectation$$(queryResult$$(), parameters.query, parameters.expected, context),
        );

        const parametersValue$$ = computed(() =>
            this.getListParametersValue$$({ met: met$$()(), values: queryResult$$() }, parameters, context),
        );

        return computed(() => parametersValue$$()(), { equal: isEqualPrimitiveObject });
    }

}
