import { computed } from '@angular/core';
import { Condition } from '../models/condition';
import { Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { ConditionGain } from '../models/condition-gain';
import { ConditionGainContextAggregate } from '../models/condition-gain-pair';
import { removeSuperfluousConditions$$ } from './condition-reduce-utils';
import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';

describe('removeSuperfluousConditions', () => {
    const createConditionGainAggregate = ({
        gain, unlimited,
    }: {
        gain: Serialized<ConditionGain>; unlimited?: boolean;
    }): ConditionGainContextAggregate => ({
        gain: ConditionGain.from(
            gain,
            mockRecastFns({
                condition: Condition.from(
                    {
                        name: gain.name,
                        unlimited,
                    },
                    mockRecastFns(),
                ),
            }),
        ),
    });

    it('should keep all of an unlimited condition', () => {
        const conditions = [
            createConditionGainAggregate({ gain: { id: '1', name: '1' } }),
            createConditionGainAggregate({ gain: { id: '2', name: '2' } }),
            ...['3', '4', '5'].map(id =>
                createConditionGainAggregate({ gain: { id, name: 'duplicate' }, unlimited: true }),
            ),
        ];

        const result = removeSuperfluousConditions$$(conditions)();
        const expected = ['1', '2', '3', '4', '5'];

        expect(
            result.map(({ gain }) => gain.id),
        ).toEqual(expected);
    });

    it('should keep one of each choice of persistent damage conditions', () => {
        const persistentDamage = 'Persistent Damage';
        const choice1 = '1d6 Fire';
        const choice2 = '1d6 Cold';

        const conditions = [
            createConditionGainAggregate({ gain: { id: '1', name: '1' } }),
            createConditionGainAggregate({ gain: { id: '2', name: '2' } }),
            createConditionGainAggregate({ gain: { id: '3', name: persistentDamage, choice: choice1 } }),
            createConditionGainAggregate({ gain: { id: '4', name: persistentDamage, choice: choice1 } }),
            createConditionGainAggregate({ gain: { id: '5', name: persistentDamage, choice: choice2 } }),
            createConditionGainAggregate({ gain: { id: '6', name: persistentDamage, choice: choice2 } }),
        ];

        const result = removeSuperfluousConditions$$(conditions)();
        const expected = ['1', '2', '3', '5'];

        expect(
            result.map(({ gain }) => gain.id),
        ).toEqual(expected);
    });

    it('should keep only one of any duplicate conditions', () => {

        const conditions = [
            ...['1', '2'].map(id =>
                createConditionGainAggregate({ gain: { id, name: 'duplicate1' } }),
            ),
            ...['3', '4'].map(id =>
                createConditionGainAggregate({ gain: { id, name: 'duplicate2' } }),
            ),
        ];

        const result = removeSuperfluousConditions$$(conditions)();
        const expected = ['1', '3'];

        expect(
            result.map(({ gain }) => gain.id),
        ).toEqual(expected);
    });

    describe('when comparing conditions', () => {
        it('should prioritize value first', () => {
            const duplicate = 'duplicate';

            const conditions = [
                createConditionGainAggregate({
                    gain: {
                        id: '1',
                        name: duplicate,
                        value: 1,
                        heightened: 10,
                        duration: 10,
                    },
                }),
                createConditionGainAggregate({
                    gain: {
                        id: '2',
                        name: duplicate,
                        value: 10,
                        heightened: 1,
                        duration: 1,
                    },
                }),
            ];

            const result = removeSuperfluousConditions$$(conditions)();
            const expected = ['2'];

            expect(
                result.map(({ gain }) => gain.id),
            ).toEqual(expected);
        });

        it('should prioritize heightened second', () => {
            const duplicate = 'duplicate';

            const conditions = [
                createConditionGainAggregate({
                    gain: {
                        id: '1',
                        name: duplicate,
                        heightened: 1,
                        duration: 10,
                    },
                }),
                createConditionGainAggregate({
                    gain: {
                        id: '2',
                        name: duplicate,
                        heightened: 10,
                        duration: 1,
                    },
                }),
            ];

            const result = removeSuperfluousConditions$$(conditions)();
            const expected = ['2'];

            expect(
                result.map(({ gain }) => gain.id),
            ).toEqual(expected);
        });

        it('should prioritize duration third', () => {
            const duplicate = 'duplicate';

            const conditions = [
                createConditionGainAggregate({
                    gain: {
                        id: '1',
                        name: duplicate,
                        // duration: 1 would be instant, which has different rules.
                        // 5 is a legitimate number value.
                        duration: 5,
                    },
                }),
                createConditionGainAggregate({
                    gain: {
                        id: '2',
                        name: duplicate,
                        duration: 10,
                    },
                }),
            ];

            const result = removeSuperfluousConditions$$(conditions)();
            const expected = ['2'];

            expect(
                result.map(({ gain }) => gain.id),
            ).toEqual(expected);
        });

        it('should prioritize order last', () => {
            const duplicate = 'duplicate';

            const conditions = [
                createConditionGainAggregate({
                    gain: {
                        id: '1',
                        name: duplicate,
                    },
                }),
                createConditionGainAggregate({
                    gain: {
                        id: '2',
                        name: duplicate,
                    },
                }),
            ];

            const result = removeSuperfluousConditions$$(conditions)();
            const expected = ['1'];

            expect(
                result.map(({ gain }) => gain.id),
            ).toEqual(expected);
        });

        describe('when comparing durations', () => {
            it('should prioritize instant first', () => {
                const duplicate = 'duplicate';

                const conditions = [
                    createConditionGainAggregate({
                        gain: {
                            id: 'regular',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'until refocus',
                            name: duplicate,
                            duration: -3,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'until rest',
                            name: duplicate,
                            duration: -2,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'permanent',
                            name: duplicate,
                            duration: -1,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'instant, then until other turn',
                            name: duplicate,
                            duration: 3,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'instant',
                            name: duplicate,
                            duration: 1,
                        },
                    }),
                ];

                const result = removeSuperfluousConditions$$(conditions)();
                const expected = ['instant'];

                expect(
                    result.map(({ gain }) => gain.id),
                ).toEqual(expected);
            });

            it('should prioritize "instant, then until another character\'s turn" next', () => {
                const duplicate = 'duplicate';

                const conditions = [
                    createConditionGainAggregate({
                        gain: {
                            id: 'regular',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'until refocus',
                            name: duplicate,
                            duration: -3,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'until rest',
                            name: duplicate,
                            duration: -2,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'permanent',
                            name: duplicate,
                            duration: -1,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'instant, then until other turn',
                            name: duplicate,
                            duration: 3,
                        },
                    }),
                ];

                const result = removeSuperfluousConditions$$(conditions)();
                const expected = ['instant, then until other turn'];

                expect(
                    result.map(({ gain }) => gain.id),
                ).toEqual(expected);
            });

            it('should prioritize permanent next', () => {
                const duplicate = 'duplicate';

                const conditions = [
                    createConditionGainAggregate({
                        gain: {
                            id: 'regular',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'until refocus',
                            name: duplicate,
                            duration: -3,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'until rest',
                            name: duplicate,
                            duration: -2,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'permanent',
                            name: duplicate,
                            duration: -1,
                        },
                    }),
                ];

                const result = removeSuperfluousConditions$$(conditions)();
                const expected = ['permanent'];

                expect(
                    result.map(({ gain }) => gain.id),
                ).toEqual(expected);
            });

            it('should prioritize until rest next', () => {
                const duplicate = 'duplicate';

                const conditions = [
                    createConditionGainAggregate({
                        gain: {
                            id: 'regular',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'until refocus',
                            name: duplicate,
                            duration: -3,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'until rest',
                            name: duplicate,
                            duration: -2,
                        },
                    }),
                ];

                const result = removeSuperfluousConditions$$(conditions)();
                const expected = ['until rest'];

                expect(
                    result.map(({ gain }) => gain.id),
                ).toEqual(expected);
            });

            it('should prioritize until refocus next', () => {
                const duplicate = 'duplicate';

                const conditions = [
                    createConditionGainAggregate({
                        gain: {
                            id: 'regular',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'until refocus',
                            name: duplicate,
                            duration: -3,
                        },
                    }),
                ];

                const result = removeSuperfluousConditions$$(conditions)();
                const expected = ['until refocus'];

                expect(
                    result.map(({ gain }) => gain.id),
                ).toEqual(expected);
            });

            it('should prioritize longer duration next', () => {
                const duplicate = 'duplicate';

                const conditions = [
                    createConditionGainAggregate({
                        gain: {
                            id: 'shorter',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: 'longer',
                            name: duplicate,
                            duration: 100,
                        },
                    }),
                ];

                const result = removeSuperfluousConditions$$(conditions)();
                const expected = ['longer'];

                expect(
                    result.map(({ gain }) => gain.id),
                ).toEqual(expected);
            });

            it('should prioritize order last', () => {
                const duplicate = 'duplicate';

                const conditions = [
                    createConditionGainAggregate({
                        gain: {
                            id: '1',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                    createConditionGainAggregate({
                        gain: {
                            id: '2',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                ];

                const result = removeSuperfluousConditions$$(conditions)();
                const expected = ['1'];

                expect(
                    result.map(({ gain }) => gain.id),
                ).toEqual(expected);
            });
        });
    });

    it('should update persistent damage conditions when choices change', () => {
        const duplicate = 'Persistent Damage';

        const firstCondition = createConditionGainAggregate({
            gain: {
                id: '1',
                name: duplicate,
                choice: '1d6 Fire',
            },
        });

        const conditions = [
            firstCondition,
            createConditionGainAggregate({
                gain: {
                    id: '2',
                    name: duplicate,
                    choice: '1d6 Fire',
                },
            }),
        ];

        const source = computed(() => removeSuperfluousConditions$$(conditions)().map(({ gain }) => gain.id));

        const expectedFirst = ['1'];
        const expectedLast = ['1', '2'];


        expect(source()).toEqual(expectedFirst);

        firstCondition.gain.choice.set('1d6 Cold');


        expect(source()).toEqual(expectedLast);
    });

    it('should update conditions when values change', () => {
        const duplicate = 'duplicate';

        const higherCondition = createConditionGainAggregate({
            gain: {
                id: 'higher',
                name: duplicate,
                value: 10,
            },
        });

        const conditions = [
            createConditionGainAggregate({
                gain: {
                    id: 'lower',
                    name: duplicate,
                    value: 5,
                },
            }),
            higherCondition,
        ];

        const result = computed(() => removeSuperfluousConditions$$(conditions)().map(({ gain }) => gain.id));

        const expectedFirst = ['higher'];
        const expectedLast = ['lower'];


        expect(result()).toEqual(expectedFirst);

        higherCondition.gain.value.set(1);

        expect(result()).toEqual(expectedLast);
    });

    it('should update conditions when durations change', () => {
        const duplicate = 'duplicate';

        const longerCondition = createConditionGainAggregate({
            gain: {
                id: 'longer',
                name: duplicate,
                duration: 100,
            },
        });

        const conditions = [
            createConditionGainAggregate({
                gain: {
                    id: 'shorter',
                    name: duplicate,
                    duration: 50,
                },
            }),
            longerCondition,
        ];

        const result = computed(() => removeSuperfluousConditions$$(conditions)().map(({ gain }) => gain.id));

        const expectedFirst = ['longer'];
        const expectedLast = ['shorter'];


        expect(result()).toEqual(expectedFirst);

        longerCondition.gain.duration.set(10);

        expect(result()).toEqual(expectedLast);
    });
});
