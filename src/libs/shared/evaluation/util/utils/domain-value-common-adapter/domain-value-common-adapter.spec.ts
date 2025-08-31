import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';
import {
    ComplexValueExact,
    ComplexValueMeetsAll,
    ComplexValueMeetsAny,
    ComplexValueArithmetic,
    ComplexValueListIndex,
    ComplexValueContext,
    ComplexValueResult,
    CountBasicQuery,
    DomainValueParameters,
    ListDomainValueParameters,
} from '../../models/complex-value';
import { Character } from 'src/libs/shared/character/util/models/character';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { signal, Signal } from '@angular/core';
import { DomainValueCommonAdapter } from './domain-value-common-adapter';
import { ComplexValueCommonAdapter } from '../complex-value-adapter/complex-value-common-adapter';

type BasicComplexValue = ComplexValueExact
| ComplexValueMeetsAll<BasicComplexValue>
| ComplexValueMeetsAny<BasicComplexValue>
| ComplexValueArithmetic<BasicComplexValue>
| ComplexValueListIndex<BasicComplexValue>;

describe('ComplexValueCommonAdapter', () => {
    let recastFns: RecastFns;
    let character: Character;
    let complexValueAdapter: ComplexValueCommonAdapter<BasicComplexValue, ComplexValueContext>;
    let adapter: DomainValueCommonAdapter<BasicComplexValue, ComplexValueContext>;
    let context: ComplexValueContext;
    let list: Array<string>;

    beforeEach(() => {
        recastFns = mockRecastFns();
        character = new Character(recastFns);

        complexValueAdapter = new ComplexValueCommonAdapter(recastFns);

        adapter = new DomainValueCommonAdapter(complexValueAdapter.resolveComplexValue$$.bind(complexValueAdapter));

        context = {
            creature: character,
            character,
            charLevel: 1,
        };

        list = ['A', 'B', 'C', 'D'];
    });

    it('should use the passed resolveChildValue$$ function for nested complex values', () => {
        let count = 0;

        const resolveChild = (): Signal<ComplexValueResult> => {
            count++;

            return signal({ met: true, value: 0 });
        };

        const adapterInstance = new DomainValueCommonAdapter<BasicComplexValue, ComplexValueContext>(resolveChild);

        const expectation = {
            // This is the child to resolve. It should call `resolveChild` once.
            isEqual: { exact: 1 },
        };

        adapterInstance.doesNumberMatchExpectation$$(0, expectation, context)();

        expect(count).toEqual(1);
    });

    it('should use the passed splitNames function for splitting names', () => {
        const query: CountBasicQuery = {
            allOfNames: 'A,B,Placeholder,D',
        };

        const splitNamesFn =
            (l: string): Array<string> => l.split(',').map(name => name === 'Placeholder' ? 'C' : name);

        const adapterInstance =
            new DomainValueCommonAdapter(complexValueAdapter.resolveComplexValue$$.bind(complexValueAdapter), splitNamesFn);

        const result = adapterInstance.applyCountBasicQuery(query, list, context);

        expect(result).toEqual(4);
    });

    describe('applyCountBasicQuery$$', () => {
        describe('without a query', () => {
            it('should count the whole list', () => {
                const result = adapter.applyCountBasicQuery(undefined, list, context);

                expect(result).toEqual(4);
            });
        });

        // name works just like anyOfNames - it's just there to make writing complex values feel more natural
        describe('with name', () => {
            it('should count the list of matches', () => {
                const query: CountBasicQuery = {
                    name: 'A',
                };

                const result = adapter.applyCountBasicQuery(query, list, context);

                expect(result).toEqual(1);
            });

            it('should count the whole list if name is empty', () => {
                const query: CountBasicQuery = {
                    name: '',
                };

                const result = adapter.applyCountBasicQuery(query, list, context);

                expect(result).toEqual(4);
            });

            it('can be a list', () => {
                const query: CountBasicQuery = {
                    name: 'A,B',
                };

                const result = adapter.applyCountBasicQuery(query, list, context);

                expect(result).toEqual(2);
            });
        });

        describe('with allOfNames', () => {
            it('should count the whole list if all are present', () => {
                const query: CountBasicQuery = {
                    allOfNames: 'A,B,C,D',
                };

                const result = adapter.applyCountBasicQuery(query, list, context);

                expect(result).toEqual(4);
            });

            it('should count the whole list if allOfNames is empty', () => {
                const query: CountBasicQuery = {
                    allOfNames: '',
                };

                const result = adapter.applyCountBasicQuery(query, list, context);

                expect(result).toEqual(4);
            });

            it('should return 0 if not all are present', () => {
                const query: CountBasicQuery = {
                    allOfNames: 'A,B,C,D,E',
                };

                const result = adapter.applyCountBasicQuery(query, list, context);

                expect(result).toEqual(0);
            });
        });

        describe('with anyOfNames', () => {
            it('should count the list of matches', () => {
                const query: CountBasicQuery = {
                    anyOfNames: 'A,D',
                };

                const result = adapter.applyCountBasicQuery(query, list, context);

                expect(result).toEqual(2);
            });

            it('should count the whole list if anyOfNames is empty', () => {
                const query: CountBasicQuery = {
                    anyOfNames: '',
                };

                const result = adapter.applyCountBasicQuery(query, list, context);

                expect(result).toEqual(4);
            });
        });

        describe('with anyNotOfNames', () => {
            it('should count the list of negative matches', () => {
                const query: CountBasicQuery = {
                    anyNotOfNames: 'A',
                };

                const result = adapter.applyCountBasicQuery(query, list, context);

                expect(result).toEqual(3);
            });

            it('should count the whole list if anyNotOfNames is empty', () => {
                const query: CountBasicQuery = {
                    name: '',
                };

                const result = adapter.applyCountBasicQuery(query, list, context);

                expect(result).toEqual(4);
            });
        });

        // Using `any` just means the whole list is counted.
        describe('with any', () => {
            it('should count the whole list if any are present', () => {
                const query: CountBasicQuery = {
                    any: true,
                };

                const result = adapter.applyCountBasicQuery(query, list, context);

                expect(result).toEqual(4);
            });

            it('should return 0 if none are present', () => {
                const query: CountBasicQuery = {
                    any: true,
                };

                const result = adapter.applyCountBasicQuery(query, [], context);

                expect(result).toEqual(0);
            });
        });
    });

    describe('doesNumberMatchBooleanExpectation', () => {
        it('should return true with no expectation', () => {
            const doesMatch = adapter.doesNumberMatchBooleanExpectation(1, undefined);

            expect(doesMatch).toEqual(true);
        });

        describe('with isTrue', () => {
            it('should be true with a non-zero value', () => {
                const doesMatch = adapter.doesNumberMatchBooleanExpectation(1, { isTrue: true });

                expect(doesMatch).toEqual(true);
            });

            it('should be false with a zero value', () => {
                const doesMatch = adapter.doesNumberMatchBooleanExpectation(0, { isTrue: true });

                expect(doesMatch).toEqual(false);
            });
        });

        describe('with isFalse', () => {
            it('should be false with a non-zero value', () => {
                const doesMatch = adapter.doesNumberMatchBooleanExpectation(1, { isFalse: true });

                expect(doesMatch).toEqual(false);
            });

            it('should be true with a zero value', () => {
                const doesMatch = adapter.doesNumberMatchBooleanExpectation(0, { isFalse: true });

                expect(doesMatch).toEqual(true);
            });
        });
    });

    describe('doesNumberListMatchBooleanExpectation', () => {
        it('should return true with no expectation', () => {
            const doesMatch = adapter.doesNumberListMatchBooleanExpectation([0, 1], {}, undefined);

            expect(doesMatch).toEqual(true);
        });

        describe('with allOfNames in the query', () => {
            describe('with isTrue', () => {
                it('should be true with all non-zero values', () => {
                    const doesMatch = adapter.doesNumberListMatchBooleanExpectation([1, 1], { allOfNames: '-' }, { isTrue: true });

                    expect(doesMatch).toEqual(true);
                });

                it('should be false with any zero value', () => {
                    const doesMatch = adapter.doesNumberListMatchBooleanExpectation([1, 0], { allOfNames: '-' }, { isTrue: true });

                    expect(doesMatch).toEqual(false);
                });
            });

            describe('with isFalse', () => {
                it('should be false with any non-zero value', () => {
                    const doesMatch = adapter.doesNumberListMatchBooleanExpectation([1, 0], { allOfNames: '-' }, { isFalse: true });

                    expect(doesMatch).toEqual(false);
                });

                it('should be true with a zero value', () => {
                    const doesMatch = adapter.doesNumberListMatchBooleanExpectation([0, 0], { allOfNames: '-' }, { isFalse: true });

                    expect(doesMatch).toEqual(true);
                });
            });
        });

        describe('without allOfNames in the query', () => {
            describe('with isTrue', () => {
                it('should be true with any non-zero values', () => {
                    const doesMatch = adapter.doesNumberListMatchBooleanExpectation([0, 1], { anyOfNames: '-' }, { isTrue: true });

                    expect(doesMatch).toEqual(true);
                });

                it('should be false with only zero values', () => {
                    const doesMatch = adapter.doesNumberListMatchBooleanExpectation([0, 0], { anyOfNames: '-' }, { isTrue: true });

                    expect(doesMatch).toEqual(false);
                });
            });

            describe('with isFalse', () => {
                it('should be true with any zero value', () => {
                    const doesMatch = adapter.doesNumberListMatchBooleanExpectation([0, 1], { anyOfNames: '-' }, { isFalse: true });

                    expect(doesMatch).toEqual(true);
                });

                it('should be false with only non-zero values', () => {
                    const doesMatch = adapter.doesNumberListMatchBooleanExpectation([1, 1], { anyOfNames: '-' }, { isFalse: true });

                    expect(doesMatch).toEqual(false);
                });
            });
        });
    });

    describe('doesNumberMatchExpectation', () => {
        it('should return true with no expectation', () => {
            const doesMatch = adapter.doesNumberMatchExpectation$$(1, undefined, context)();

            expect(doesMatch).toEqual(true);
        });

        describe('with no matching properties', () => {
            it('should be true with a non-zero value', () => {
                const doesMatch = adapter.doesNumberMatchExpectation$$(1, {}, context)();

                expect(doesMatch).toEqual(true);
            });

            it('should be false with a zero value', () => {
                const doesMatch = adapter.doesNumberMatchExpectation$$(0, {}, context)();

                expect(doesMatch).toEqual(false);
            });
        });

        describe('with isTrue', () => {
            it('should be true with a non-zero value', () => {
                const doesMatch = adapter.doesNumberMatchExpectation$$(1, { isTrue: true }, context)();

                expect(doesMatch).toEqual(true);
            });

            it('should be false with a zero value', () => {
                const doesMatch = adapter.doesNumberMatchExpectation$$(0, { isTrue: true }, context)();

                expect(doesMatch).toEqual(false);
            });
        });

        describe('with isFalse', () => {
            it('should be false with a non-zero value', () => {
                const doesMatch = adapter.doesNumberMatchExpectation$$(1, { isFalse: true }, context)();

                expect(doesMatch).toEqual(false);
            });

            it('should be true with a zero value', () => {
                const doesMatch = adapter.doesNumberMatchExpectation$$(0, { isFalse: true }, context)();

                expect(doesMatch).toEqual(true);
            });
        });

        describe('with isEqual', () => {
            it('should be true with an equal value', () => {
                const doesMatch = adapter.doesNumberMatchExpectation$$(1, { isEqual: { exact: 1 } }, context)();

                expect(doesMatch).toEqual(true);
            });

            it('should be false with a different value', () => {
                const doesMatch = adapter.doesNumberMatchExpectation$$(0, { isEqual: { exact: 1 } }, context)();

                expect(doesMatch).toEqual(false);
            });
        });

        describe('with isGreaterThan', () => {
            it('should be true with a greater value', () => {
                const doesMatch = adapter.doesNumberMatchExpectation$$(2, { isGreaterThan: { exact: 1 } }, context)();

                expect(doesMatch).toEqual(true);
            });

            it('should be false with an equal value', () => {
                const doesMatch = adapter.doesNumberMatchExpectation$$(1, { isGreaterThan: { exact: 1 } }, context)();

                expect(doesMatch).toEqual(false);
            });

            it('should be false with a lesser value', () => {
                const doesMatch = adapter.doesNumberMatchExpectation$$(0, { isGreaterThan: { exact: 1 } }, context)();

                expect(doesMatch).toEqual(false);
            });
        });

        describe('with isLesserThan', () => {
            it('should be true with a lesser value', () => {
                const doesMatch = adapter.doesNumberMatchExpectation$$(0, { isLesserThan: { exact: 1 } }, context)();

                expect(doesMatch).toEqual(true);
            });

            it('should be false with an equal value', () => {
                const doesMatch = adapter.doesNumberMatchExpectation$$(1, { isLesserThan: { exact: 1 } }, context)();

                expect(doesMatch).toEqual(false);
            });

            it('should be false with a greater value', () => {
                const doesMatch = adapter.doesNumberMatchExpectation$$(2, { isLesserThan: { exact: 1 } }, context)();

                expect(doesMatch).toEqual(false);
            });
        });
    });

    describe('doesNumberListMatchExpectation$$', () => {
        it('should return true with no expectation', () => {
            const doesMatch = adapter.doesNumberListMatchExpectation$$([0, 1], {}, undefined, context)();

            expect(doesMatch).toEqual(true);
        });

        describe('with no matching properties', () => {
            it('should be true with any values', () => {
                const doesMatch = adapter.doesNumberListMatchExpectation$$([0, 1], {}, {}, context)();

                expect(doesMatch).toEqual(true);
            });

            it('should be false with no values', () => {
                const doesMatch = adapter.doesNumberListMatchExpectation$$([], {}, {}, context)();

                expect(doesMatch).toEqual(false);
            });
        });

        describe('with allOfNames in the query', () => {
            describe('with isTrue', () => {
                it('should be true with all non-zero values', () => {
                    const doesMatch = adapter.doesNumberListMatchExpectation$$([1, 1], { allOfNames: '-' }, { isTrue: true }, context)();

                    expect(doesMatch).toEqual(true);
                });

                it('should be false with any zero value', () => {
                    const doesMatch = adapter.doesNumberListMatchExpectation$$([1, 0], { allOfNames: '-' }, { isTrue: true }, context)();

                    expect(doesMatch).toEqual(false);
                });
            });

            describe('with isFalse', () => {
                it('should be false with any non-zero value', () => {
                    const doesMatch = adapter.doesNumberListMatchExpectation$$([1, 0], { allOfNames: '-' }, { isFalse: true }, context)();

                    expect(doesMatch).toEqual(false);
                });

                it('should be true with a zero value', () => {
                    const doesMatch = adapter.doesNumberListMatchExpectation$$([0, 0], { allOfNames: '-' }, { isFalse: true }, context)();

                    expect(doesMatch).toEqual(true);
                });
            });

            describe('with isEqual', () => {
                it('should be true with only equal values', () => {
                    const doesMatch =
                        adapter.doesNumberListMatchExpectation$$([1, 1], { allOfNames: '-' }, { isEqual: { exact: 1 } }, context)();

                    expect(doesMatch).toEqual(true);
                });

                it('should be false with any different value', () => {
                    const doesMatch =
                        adapter.doesNumberListMatchExpectation$$([0, 1], { allOfNames: '-' }, { isEqual: { exact: 1 } }, context)();

                    expect(doesMatch).toEqual(false);
                });
            });

            describe('with isGreaterThan', () => {
                it('should be true with only greater values', () => {
                    const doesMatch =
                        adapter.doesNumberListMatchExpectation$$([2, 2], { allOfNames: '-' }, { isGreaterThan: { exact: 1 } }, context)();

                    expect(doesMatch).toEqual(true);
                });

                it('should be false with any equal value', () => {
                    const doesMatch =
                        adapter.doesNumberListMatchExpectation$$([1, 2], { allOfNames: '-' }, { isGreaterThan: { exact: 1 } }, context)();

                    expect(doesMatch).toEqual(false);
                });

                it('should be false with any lesser value', () => {
                    const doesMatch =
                        adapter.doesNumberListMatchExpectation$$([0, 2], { allOfNames: '-' }, { isGreaterThan: { exact: 1 } }, context)();

                    expect(doesMatch).toEqual(false);
                });
            });

            describe('with isLesserThan', () => {
                it('should be true with only greater values', () => {
                    const doesMatch =
                        adapter.doesNumberListMatchExpectation$$([0, 0], { allOfNames: '=' }, { isLesserThan: { exact: 1 } }, context)();

                    expect(doesMatch).toEqual(true);
                });

                it('should be false with any equal value', () => {
                    const doesMatch =
                        adapter.doesNumberListMatchExpectation$$([0, 1], { allOfNames: '=' }, { isLesserThan: { exact: 1 } }, context)();

                    expect(doesMatch).toEqual(false);
                });

                it('should be false with any smaller value', () => {
                    const doesMatch =
                        adapter.doesNumberListMatchExpectation$$([0, 2], { allOfNames: '=' }, { isLesserThan: { exact: 1 } }, context)();

                    expect(doesMatch).toEqual(false);
                });
            });
        });

        describe('without allOfNames in the query', () => {
            describe('with isTrue', () => {
                it('should be true with any non-zero values', () => {
                    const doesMatch = adapter.doesNumberListMatchExpectation$$([0, 1], { anyOfNames: '-' }, { isTrue: true }, context)();

                    expect(doesMatch).toEqual(true);
                });

                it('should be false with only zero values', () => {
                    const doesMatch = adapter.doesNumberListMatchExpectation$$([0, 0], { anyOfNames: '-' }, { isTrue: true }, context)();

                    expect(doesMatch).toEqual(false);
                });
            });

            describe('with isFalse', () => {
                it('should be true with any zero value', () => {
                    const doesMatch = adapter.doesNumberListMatchExpectation$$([0, 1], { anyOfNames: '-' }, { isFalse: true }, context)();

                    expect(doesMatch).toEqual(true);
                });

                it('should be false with only non-zero values', () => {
                    const doesMatch = adapter.doesNumberListMatchExpectation$$([1, 1], { anyOfNames: '-' }, { isFalse: true }, context)();

                    expect(doesMatch).toEqual(false);
                });
            });

            describe('with isEqual', () => {
                it('should be true with any equal value', () => {
                    const doesMatch =
                        adapter.doesNumberListMatchExpectation$$([0, 1], { anyOfNames: '-' }, { isEqual: { exact: 1 } }, context)();

                    expect(doesMatch).toEqual(true);
                });

                it('should be false with only different values', () => {
                    const doesMatch =
                        adapter.doesNumberListMatchExpectation$$([0, 0], { anyOfNames: '-' }, { isEqual: { exact: 1 } }, context)();

                    expect(doesMatch).toEqual(false);
                });
            });

            describe('with isGreaterThan', () => {
                it('should be true with any greater value', () => {
                    const doesMatch =
                        adapter.doesNumberListMatchExpectation$$([0, 2], { anyOfNames: '-' }, { isGreaterThan: { exact: 1 } }, context)();

                    expect(doesMatch).toEqual(true);
                });

                it('should be false without any greater value', () => {
                    const doesMatch =
                        adapter.doesNumberListMatchExpectation$$([0, 1], { anyOfNames: '-' }, { isGreaterThan: { exact: 1 } }, context)();

                    expect(doesMatch).toEqual(false);
                });
            });

            describe('with isLesserThan', () => {
                it('should be true with any lesser values', () => {
                    const doesMatch =
                        adapter.doesNumberListMatchExpectation$$([0, 2], { anyOfNames: '=' }, { isLesserThan: { exact: 1 } }, context)();

                    expect(doesMatch).toEqual(true);
                });

                it('should be false without any lesser value', () => {
                    const doesMatch =
                        adapter.doesNumberListMatchExpectation$$([1, 2], { anyOfNames: '=' }, { isLesserThan: { exact: 1 } }, context)();

                    expect(doesMatch).toEqual(false);
                });
            });
        });
    });

    describe('getParametersValue$$', () => {
        describe('with useValue', () => {
            it('should determine the result based on the useValue if met', () => {
                const parameters: DomainValueParameters<BasicComplexValue> = {
                    useAsValue: true,
                    useValue: { exact: 4 },
                    fallBack: { exact: 2 },
                };

                const result = adapter.getParametersValue$$(
                    { met: true, value: 1 },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(4);
            });

            it('should use the fallback if not met', () => {
                const parameters: DomainValueParameters<BasicComplexValue> = {
                    useValue: { exact: 4 },
                    fallBack: { exact: 2 },
                };

                const result = adapter.getParametersValue$$(
                    { met: false, value: 1 },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(2);
            });

            it('should default to 0 if not met without a fallback', () => {
                const parameters: DomainValueParameters<BasicComplexValue> = {};

                const result = adapter.getParametersValue$$(
                    { met: false, value: 1 },
                    parameters,
                    context,
                )();

                expect(result.met).toBeFalsy();
                expect(result.value).toEqual(0);
            });
        });

        describe('with useAsValue and without useValue', () => {
            it('should use the given value if met', () => {
                const parameters: DomainValueParameters<BasicComplexValue> = {
                    useAsValue: true,
                    fallBack: { exact: 2 },
                };

                const result = adapter.getParametersValue$$(
                    { met: true, value: 1 },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(1);
            });

            it('should use the fallback if not met', () => {
                const parameters: DomainValueParameters<BasicComplexValue> = {
                    useAsValue: true,
                    fallBack: { exact: 2 },
                };

                const result = adapter.getParametersValue$$(
                    { met: false, value: 1 },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(2);
            });

            it('should default to 0 if not met without a fallback', () => {
                const parameters: DomainValueParameters<BasicComplexValue> = {
                    useAsValue: true,
                };

                const result = adapter.getParametersValue$$(
                    { met: false, value: 1 },
                    parameters,
                    context,
                )();

                expect(result.met).toBeFalsy();
                expect(result.value).toEqual(0);
            });
        });

        describe('without any use- parameters', () => {
            it('should use the given value if met', () => {
                const parameters: DomainValueParameters<BasicComplexValue> = {
                    fallBack: { exact: 2 },
                };

                const result = adapter.getParametersValue$$(
                    { met: true, value: 1 },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(1);
            });

            it('should use the fallback if not met', () => {
                const parameters: DomainValueParameters<BasicComplexValue> = {
                    fallBack: { exact: 2 },
                };

                const result = adapter.getParametersValue$$(
                    { met: false, value: 1 },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(2);
            });

            it('should default to 0 if not met without a fallback', () => {
                const parameters: DomainValueParameters<BasicComplexValue> = {};

                const result = adapter.getParametersValue$$(
                    { met: false, value: 1 },
                    parameters,
                    context,
                )();

                expect(result.met).toBeFalsy();
                expect(result.value).toEqual(0);
            });
        });
    });

    describe('getListParametersValue$$', () => {
        describe('with useValue', () => {
            it('should determine the result based on the useValue if met', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {
                    useValue: { exact: 4 },
                    useLowestAsValue: true,
                    useHighestAsValue: true,
                    fallBack: { exact: 2 },
                };

                const result = adapter.getListParametersValue$$(
                    { met: true, values: [1, 2, 3] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(4);
            });

            it('should use the fallback if not met', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {
                    useValue: { exact: 4 },
                    useLowestAsValue: true,
                    useHighestAsValue: true,
                    fallBack: { exact: 2 },
                };

                const result = adapter.getListParametersValue$$(
                    { met: false, values: [1, 2, 3] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(2);
            });

            it('should default to 0 if not met without a fallback', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {};

                const result = adapter.getListParametersValue$$(
                    { met: false, values: [1, 2, 3] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeFalsy();
                expect(result.value).toEqual(0);
            });
        });

        describe('with useLowestAsValue and without useValue', () => {
            it('should use the lowest given value if met', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {
                    useLowestAsValue: true,
                    useHighestAsValue: true,
                    fallBack: { exact: 2 },
                };

                const result = adapter.getListParametersValue$$(
                    { met: true, values: [1, 2, 3] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(1);
            });

            it('should use the fallback if not met', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {
                    useLowestAsValue: true,
                    useHighestAsValue: true,
                    fallBack: { exact: 2 },
                };

                const result = adapter.getListParametersValue$$(
                    { met: false, values: [1, 2, 3] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(2);
            });

            it('should use the fallback if no values are given', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {
                    useLowestAsValue: true,
                    useHighestAsValue: true,
                    fallBack: { exact: 2 },
                };

                const result = adapter.getListParametersValue$$(
                    { met: true, values: [] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(2);
            });

            it('should default to 0 if not met without a fallback', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {
                    useLowestAsValue: true,
                    useHighestAsValue: true,
                };

                const result = adapter.getListParametersValue$$(
                    { met: false, values: [1, 2, 3] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeFalsy();
                expect(result.value).toEqual(0);
            });

            it('should default to 0 with met=true if no value are given without a fallback', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {
                    useLowestAsValue: true,
                    useHighestAsValue: true,
                };

                const result = adapter.getListParametersValue$$(
                    { met: true, values: [] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(0);
            });
        });

        describe('with useHighestAsValue and without useValue or useLowestAsValue', () => {
            it('should use the highest given value if met', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {
                    useHighestAsValue: true,
                    fallBack: { exact: 2 },
                };

                const result = adapter.getListParametersValue$$(
                    { met: true, values: [1, 2, 3] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(3);
            });

            it('should use the fallback if not met', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {
                    useHighestAsValue: true,
                    fallBack: { exact: 2 },
                };

                const result = adapter.getListParametersValue$$(
                    { met: false, values: [1, 2, 3] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(2);
            });

            it('should use the fallback if no values are given', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {
                    useHighestAsValue: true,
                    fallBack: { exact: 2 },
                };

                const result = adapter.getListParametersValue$$(
                    { met: true, values: [] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(2);
            });

            it('should default to 0 if not met without a fallback', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {
                    useHighestAsValue: true,
                };

                const result = adapter.getListParametersValue$$(
                    { met: false, values: [1, 2, 3] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeFalsy();
                expect(result.value).toEqual(0);
            });

            it('should default to 0 with met=true if no value are given without a fallback', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {
                    useHighestAsValue: true,
                };

                const result = adapter.getListParametersValue$$(
                    { met: true, values: [] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(0);
            });
        });

        describe('without any use- parameters', () => {
            it('should use the highest given value if met', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {
                    fallBack: { exact: 2 },
                };

                const result = adapter.getListParametersValue$$(
                    { met: true, values: [1, 2, 3] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(3);
            });

            it('should use the fallback if not met', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {
                    fallBack: { exact: 2 },
                };

                const result = adapter.getListParametersValue$$(
                    { met: false, values: [1, 2, 3] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(2);
            });

            it('should use the fallback if no values are given', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {
                    fallBack: { exact: 2 },
                };

                const result = adapter.getListParametersValue$$(
                    { met: true, values: [] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(2);
            });

            it('should default to 0 if not met without a fallback', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {};

                const result = adapter.getListParametersValue$$(
                    { met: false, values: [1, 2, 3] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeFalsy();
                expect(result.value).toEqual(0);
            });

            it('should default to 0 with met=true if no value are given without a fallback', () => {
                const parameters: ListDomainValueParameters<BasicComplexValue> = {};

                const result = adapter.getListParametersValue$$(
                    { met: true, values: [] },
                    parameters,
                    context,
                )();

                expect(result.met).toBeTruthy();
                expect(result.value).toEqual(0);
            });
        });
    });

    describe('getValueResult$$', () => {
        it('should determine the value and met status based on the query result value and parameters', () => {
            const queryResult = signal(4);

            // Expects more than 8, otherwise returns 1+1.
            // With queryResult 4, this should result in `{ met: true; value: 2 }`
            const parameters: DomainValueParameters<BasicComplexValue> = {
                expected: {
                    isGreaterThan: {
                        exact: 8,
                    },
                },
                useAsValue: true,
                fallBack: {
                    arithmetic: {
                        operator: '+',
                        values: [
                            { exact: 1 },
                            { exact: 1 },
                        ],
                    },
                },
            };

            const result = adapter.getValueResult$$(
                queryResult,
                parameters,
                context,
            )();

            expect(result.met).toBeTruthy();
            expect(result.value).toEqual(2);
        });
    });


    describe('getListValueResult$$', () => {
        it('should determine the value and met status based on the query result value and parameters', () => {
            const queryResult = signal([4, 6]);

            // Expects more than 8, otherwise returns 1+1.
            // With queryResult 4, 6, this should result in `{ met: true; value: 2 }`
            const parameters: ListDomainValueParameters<BasicComplexValue> = {
                expected: {
                    isGreaterThan: {
                        exact: 8,
                    },
                },
                useHighestAsValue: true,
                fallBack: {
                    arithmetic: {
                        operator: '+',
                        values: [
                            { exact: 1 },
                            { exact: 1 },
                        ],
                    },
                },
            };

            const result = adapter.getValueListResult$$(
                queryResult,
                parameters,
                context,
            )();

            expect(result.met).toBeTruthy();
            expect(result.value).toEqual(2);
        });
    });
});
