import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';
import {
    ComplexValueExact,
    ComplexValueMeetsAll,
    ComplexValueMeetsAny,
    ComplexValueArithmetic,
    ComplexValueListIndex,
    ComplexValueContext,
    ComplexValueResult,
} from '../../models/complex-value';
import { ComplexValueCommonAdapter } from './complex-value-common-adapter';
import { Character } from 'src/libs/shared/character/util/models/character';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { signal, Signal } from '@angular/core';

type BasicComplexValue = ComplexValueExact
| ComplexValueMeetsAll<BasicComplexValue>
| ComplexValueMeetsAny<BasicComplexValue>
| ComplexValueArithmetic<BasicComplexValue>
| ComplexValueListIndex<BasicComplexValue>;

describe('ComplexValueCommonAdapter', () => {
    let recastFns: RecastFns;
    let character: Character;
    let adapter: ComplexValueCommonAdapter<BasicComplexValue, ComplexValueContext>;
    let context: ComplexValueContext;
    let value: BasicComplexValue;

    beforeEach(() => {
        recastFns = mockRecastFns();
        character = new Character(recastFns);
        adapter = new ComplexValueCommonAdapter(recastFns);

        context = {
            creature: character,
            character,
            charLevel: 1,
        };
    });

    it('should use the passed resolveChildValue$$ function for nested complex values', () => {
        let count = 0;

        const resolveChild = (): Signal<ComplexValueResult> => {
            count++;

            return signal({ met: true, value: 0 });
        };

        const adapterInstance = new ComplexValueCommonAdapter(recastFns, resolveChild);

        value = {
            meetsAll: [
                // This is the child to resolve. It should call `resolveChild` once.
                { exact: 1 },
            ],
        };

        adapterInstance.resolveComplexValue$$(value, context)();

        expect(count).toEqual(1);
    });

    describe('resolveExact$$', () => {
        it('should resolve an exact complex value', () => {
            value = { exact: 1 };

            const result = adapter.resolveComplexValue$$(value, context)();

            expect(result.value).toEqual(1);
        });

        it('should always be met', () => {
            value = { exact: 0 };

            const result = adapter.resolveComplexValue$$(value, context)();

            expect(result.met).toBeTruthy();
        });
    });

    describe('resolveMeetsAll$$', () => {
        it('should be met if all are met', () => {
            value = {
                meetsAll: [
                    { exact: 1 },
                    { exact: 1 },
                ],
            };

            const result = adapter.resolveComplexValue$$(value, context)();

            expect(result.met).toBeTruthy();
        });

        it('should not be met if not all are met', () => {
            value = {
                meetsAll: [
                    { exact: 1 },
                    // MeetsAny with no entries fails (meetsAll does not fail)
                    { meetsAny: [] },
                ],
            };

            const result = adapter.resolveComplexValue$$(value, context)();

            expect(result.met).toBeFalsy();
        });
    });

    describe('resolveMeetsAny$$', () => {
        it('should resolve a meetsAny complex value', () => {
            value = {
                meetsAny: [
                    { exact: 1 },
                ],
            };

            const result = adapter.resolveComplexValue$$(value, context)();

            expect(result.met).toBeTruthy();
        });

        it('should be met if any are met', () => {
            value = {
                meetsAny: [
                    { exact: 1 },
                    // meetsAny with no entries fails (meetsAll does not fail)
                    { meetsAny: [] },
                ],
            };

            const result = adapter.resolveComplexValue$$(value, context)();

            expect(result.met).toBeTruthy();
        });

        it('should not be met if none are met', () => {
            value = {
                meetsAny: [
                    // meetsAny with no entries fails (meetsAll does not fail)
                    { meetsAny: [] },
                    { meetsAny: [] },
                ],
            };

            const result = adapter.resolveComplexValue$$(value, context)();

            expect(result.met).toBeFalsy();
        });
    });

    describe('resolveArithmetic$$', () => {
        describe('with multiArithmetic', () => {
            describe('with operator +', () => {
                it('should add the values', () => {
                    value = {
                        arithmetic: {
                            operator: '+',
                            values: [
                                { exact: 1 },
                                { exact: 2 },
                            ],
                        },
                    };

                    const result = adapter.resolveComplexValue$$(value, context)();

                    expect(result.value).toEqual(3);
                });
            });

            describe('with operator *', () => {
                it('should add the values', () => {
                    value = {
                        arithmetic: {
                            operator: '*',
                            values: [
                                { exact: 1 },
                                { exact: 2 },
                            ],
                        },
                    };

                    const result = adapter.resolveComplexValue$$(value, context)();

                    expect(result.value).toEqual(2);
                });
            });

            describe('with operator max', () => {
                it('should return the highest value', () => {
                    value = {
                        arithmetic: {
                            operator: 'max',
                            values: [
                                { exact: 1 },
                                { exact: 2 },
                            ],
                        },
                    };

                    const result = adapter.resolveComplexValue$$(value, context)();

                    expect(result.value).toEqual(2);
                });
            });

            describe('with operator min', () => {
                it('should return the lowest value', () => {
                    value = {
                        arithmetic: {
                            operator: 'min',
                            values: [
                                { exact: 1 },
                                { exact: 2 },
                            ],
                        },
                    };

                    const result = adapter.resolveComplexValue$$(value, context)();

                    expect(result.value).toEqual(1);
                });
            });

            describe('with rounding down', () => {
                it('should round down after the operation', () => {
                    value = {
                        arithmetic: {
                            operator: '*',
                            values: [
                                { exact: 1.5 },
                                { exact: 3 },
                            ],
                            rounding: 'down',
                        },
                    };

                    const result = adapter.resolveComplexValue$$(value, context)();

                    expect(result.value).toEqual(4);
                });
            });

            describe('with rounding up', () => {
                it('should round up after the operation', () => {
                    value = {
                        arithmetic: {
                            operator: '*',
                            values: [
                                { exact: 1.5 },
                                { exact: 3 },
                            ],
                            rounding: 'up',
                        },
                    };

                    const result = adapter.resolveComplexValue$$(value, context)();

                    expect(result.value).toEqual(5);
                });
            });
        });

        describe('with dualArithmetic', () => {
            describe('with operator -', () => {
                it('should subtract the right value from the left value', () => {
                    value = {
                        arithmetic: {
                            operator: '-',
                            leftValue: {
                                exact: 4,
                            },
                            rightValue: {
                                exact: 1,
                            },
                        },
                    };

                    const result = adapter.resolveComplexValue$$(value, context)();

                    expect(result.value).toEqual(3);
                });
            });

            describe('with operator /', () => {
                it('should divide the left value by the right value', () => {
                    value = {
                        arithmetic: {
                            operator: '/',
                            leftValue: {
                                exact: 4,
                            },
                            rightValue: {
                                exact: 2,
                            },
                        },
                    };

                    const result = adapter.resolveComplexValue$$(value, context)();

                    expect(result.value).toEqual(2);
                });
            });

            describe('with rounding down', () => {
                it('should round down after the operation', () => {
                    value = {
                        arithmetic: {
                            operator: '/',
                            leftValue: {
                                exact: 7,
                            },
                            rightValue: {
                                exact: 2,
                            },
                            rounding: 'down',
                        },
                    };

                    const result = adapter.resolveComplexValue$$(value, context)();

                    expect(result.value).toEqual(3);
                });
            });

            describe('with rounding up', () => {
                it('should round up after the operation', () => {
                    value = {
                        arithmetic: {
                            operator: '/',
                            leftValue: {
                                exact: 7,
                            },
                            rightValue: {
                                exact: 2,
                            },
                            rounding: 'up',
                        },
                    };

                    const result = adapter.resolveComplexValue$$(value, context)();

                    expect(result.value).toEqual(4);
                });
            });
        });
    });

    describe('resolveListIndex', () => {
        it('should pick the index from the list', () => {
            value = {
                list: [
                    { exact: 1 },
                    { exact: 2 },
                ],
                index: {
                    exact: 1,
                },
            };

            const result = adapter.resolveComplexValue$$(value, context)();

            expect(result.value).toEqual(2);
        });

        it('should use the fallback if the index is outside of the list', () => {
            value = {
                list: [
                    { exact: 1 },
                    { exact: 2 },
                ],
                index: {
                    exact: 4,
                },
                fallBack: {
                    exact: 8,
                },
            };

            const result = adapter.resolveComplexValue$$(value, context)();

            expect(result.value).toEqual(8);
        });

        it('should return 0 with no fallback if the index is outside of the list', () => {
            value = {
                list: [
                    { exact: 1 },
                    { exact: 2 },
                ],
                index: {
                    exact: 4,
                },
            };

            const result = adapter.resolveComplexValue$$(value, context)();

            expect(result.value).toEqual(0);
        });
    });
});
