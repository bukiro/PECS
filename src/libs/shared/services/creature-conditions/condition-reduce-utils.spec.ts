import { Condition } from 'src/app/classes/conditions/condition';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { ConditionGainPair } from './condition-gain-pair';
import { mockRecastFns } from '../../definitions/interfaces/recast-fns';
import { removeSuperfluousConditions$ } from './condition-reduce-utils';
import { firstValueFrom, lastValueFrom, map, share, take } from 'rxjs';

const recastFns = mockRecastFns();

describe('removeSuperfluousConditions', () => {
    const createConditionPair = ({
        gain, unlimited,
    }: {
        gain: Partial<ConditionGain>; unlimited?: boolean;
    }): ConditionGainPair => ({
        gain: ConditionGain.from(gain, recastFns),
        condition: Condition.from(
            {
                name: gain.name,
                unlimited,
            },
            recastFns,
        ),
    });

    it('should keep all of an unlimited condition', async () => {
        const conditions = [
            createConditionPair({ gain: { id: '1', name: '1' } }),
            createConditionPair({ gain: { id: '2', name: '2' } }),
            ...['3', '4', '5'].map(id =>
                createConditionPair({ gain: { id, name: 'duplicate' }, unlimited: true }),
            ),
        ];

        const result = await firstValueFrom(removeSuperfluousConditions$(conditions));
        const expected = ['1', '2', '3', '4', '5'];

        expect(
            result.map(({ gain }) => gain.id),
        ).toEqual(expected);
    });

    it('should keep one of each choice of persistent damage conditions', async () => {
        const persistentDamage = 'Persistent Damage';
        const choice1 = '1d6 Fire';
        const choice2 = '1d6 Cold';

        const conditions = [
            createConditionPair({ gain: { id: '1', name: '1' } }),
            createConditionPair({ gain: { id: '2', name: '2' } }),
            createConditionPair({ gain: { id: '3', name: persistentDamage, choice: choice1 } }),
            createConditionPair({ gain: { id: '4', name: persistentDamage, choice: choice1 } }),
            createConditionPair({ gain: { id: '5', name: persistentDamage, choice: choice2 } }),
            createConditionPair({ gain: { id: '6', name: persistentDamage, choice: choice2 } }),
        ];

        const result = await firstValueFrom(removeSuperfluousConditions$(conditions));
        const expected = ['1', '2', '3', '5'];

        expect(
            result.map(({ gain }) => gain.id),
        ).toEqual(expected);
    });

    it('should keep only one of any duplicate conditions', async () => {

        const conditions = [
            ...['1', '2'].map(id =>
                createConditionPair({ gain: { id, name: 'duplicate1' } }),
            ),
            ...['3', '4'].map(id =>
                createConditionPair({ gain: { id, name: 'duplicate2' } }),
            ),
        ];

        const result = await firstValueFrom(removeSuperfluousConditions$(conditions));
        const expected = ['1', '3'];

        expect(
            result.map(({ gain }) => gain.id),
        ).toEqual(expected);
    });

    describe('when comparing conditions', () => {
        it('should prioritize value first', async () => {
            const duplicate = 'duplicate';

            const conditions = [
                createConditionPair({
                    gain: {
                        id: '1',
                        name: duplicate,
                        value: 1,
                        heightened: 10,
                        duration: 10,
                    },
                }),
                createConditionPair({
                    gain: {
                        id: '2',
                        name: duplicate,
                        value: 10,
                        heightened: 1,
                        duration: 1,
                    },
                }),
            ];

            const result = await firstValueFrom(removeSuperfluousConditions$(conditions));
            const expected = ['2'];

            expect(
                result.map(({ gain }) => gain.id),
            ).toEqual(expected);
        });

        it('should prioritize heightened second', async () => {
            const duplicate = 'duplicate';

            const conditions = [
                createConditionPair({
                    gain: {
                        id: '1',
                        name: duplicate,
                        heightened: 1,
                        duration: 10,
                    },
                }),
                createConditionPair({
                    gain: {
                        id: '2',
                        name: duplicate,
                        heightened: 10,
                        duration: 1,
                    },
                }),
            ];

            const result = await firstValueFrom(removeSuperfluousConditions$(conditions));
            const expected = ['2'];

            expect(
                result.map(({ gain }) => gain.id),
            ).toEqual(expected);
        });

        it('should prioritize duration third', async () => {
            const duplicate = 'duplicate';

            const conditions = [
                createConditionPair({
                    gain: {
                        id: '1',
                        name: duplicate,
                        // duration: 1 would be instant, which has different rules.
                        // 5 is a legitimate number value.
                        duration: 5,
                    },
                }),
                createConditionPair({
                    gain: {
                        id: '2',
                        name: duplicate,
                        duration: 10,
                    },
                }),
            ];

            const result = await firstValueFrom(removeSuperfluousConditions$(conditions));
            const expected = ['2'];

            expect(
                result.map(({ gain }) => gain.id),
            ).toEqual(expected);
        });

        it('should prioritize order last', async () => {
            const duplicate = 'duplicate';

            const conditions = [
                createConditionPair({
                    gain: {
                        id: '1',
                        name: duplicate,
                    },
                }),
                createConditionPair({
                    gain: {
                        id: '2',
                        name: duplicate,
                    },
                }),
            ];

            const result = await firstValueFrom(removeSuperfluousConditions$(conditions));
            const expected = ['1'];

            expect(
                result.map(({ gain }) => gain.id),
            ).toEqual(expected);
        });

        describe('when comparing durations', () => {
            it('should prioritize instant first', async () => {
                const duplicate = 'duplicate';

                const conditions = [
                    createConditionPair({
                        gain: {
                            id: 'regular',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'until refocus',
                            name: duplicate,
                            duration: -3,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'until rest',
                            name: duplicate,
                            duration: -2,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'permanent',
                            name: duplicate,
                            duration: -1,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'instant, then until other turn',
                            name: duplicate,
                            duration: 3,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'instant',
                            name: duplicate,
                            duration: 1,
                        },
                    }),
                ];

                const result = await firstValueFrom(removeSuperfluousConditions$(conditions));
                const expected = ['instant'];

                expect(
                    result.map(({ gain }) => gain.id),
                ).toEqual(expected);
            });

            it('should prioritize "instant, then until another character\'s turn" next', async () => {
                const duplicate = 'duplicate';

                const conditions = [
                    createConditionPair({
                        gain: {
                            id: 'regular',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'until refocus',
                            name: duplicate,
                            duration: -3,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'until rest',
                            name: duplicate,
                            duration: -2,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'permanent',
                            name: duplicate,
                            duration: -1,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'instant, then until other turn',
                            name: duplicate,
                            duration: 3,
                        },
                    }),
                ];

                const result = await firstValueFrom(removeSuperfluousConditions$(conditions));
                const expected = ['instant, then until other turn'];

                expect(
                    result.map(({ gain }) => gain.id),
                ).toEqual(expected);
            });

            it('should prioritize permanent next', async () => {
                const duplicate = 'duplicate';

                const conditions = [
                    createConditionPair({
                        gain: {
                            id: 'regular',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'until refocus',
                            name: duplicate,
                            duration: -3,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'until rest',
                            name: duplicate,
                            duration: -2,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'permanent',
                            name: duplicate,
                            duration: -1,
                        },
                    }),
                ];

                const result = await firstValueFrom(removeSuperfluousConditions$(conditions));
                const expected = ['permanent'];

                expect(
                    result.map(({ gain }) => gain.id),
                ).toEqual(expected);
            });

            it('should prioritize until rest next', async () => {
                const duplicate = 'duplicate';

                const conditions = [
                    createConditionPair({
                        gain: {
                            id: 'regular',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'until refocus',
                            name: duplicate,
                            duration: -3,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'until rest',
                            name: duplicate,
                            duration: -2,
                        },
                    }),
                ];

                const result = await firstValueFrom(removeSuperfluousConditions$(conditions));
                const expected = ['until rest'];

                expect(
                    result.map(({ gain }) => gain.id),
                ).toEqual(expected);
            });

            it('should prioritize until refocus next', async () => {
                const duplicate = 'duplicate';

                const conditions = [
                    createConditionPair({
                        gain: {
                            id: 'regular',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'until refocus',
                            name: duplicate,
                            duration: -3,
                        },
                    }),
                ];

                const result = await firstValueFrom(removeSuperfluousConditions$(conditions));
                const expected = ['until refocus'];

                expect(
                    result.map(({ gain }) => gain.id),
                ).toEqual(expected);
            });

            it('should prioritize longer duration next', async () => {
                const duplicate = 'duplicate';

                const conditions = [
                    createConditionPair({
                        gain: {
                            id: 'shorter',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: 'longer',
                            name: duplicate,
                            duration: 100,
                        },
                    }),
                ];

                const result = await firstValueFrom(removeSuperfluousConditions$(conditions));
                const expected = ['longer'];

                expect(
                    result.map(({ gain }) => gain.id),
                ).toEqual(expected);
            });

            it('should prioritize order last', async () => {
                const duplicate = 'duplicate';

                const conditions = [
                    createConditionPair({
                        gain: {
                            id: '1',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                    createConditionPair({
                        gain: {
                            id: '2',
                            name: duplicate,
                            duration: 10,
                        },
                    }),
                ];

                const result = await firstValueFrom(removeSuperfluousConditions$(conditions));
                const expected = ['1'];

                expect(
                    result.map(({ gain }) => gain.id),
                ).toEqual(expected);
            });
        });
    });

    it('should update persistent damage conditions when choices change', done => {
        const duplicate = 'Persistent Damage';

        const firstCondition = createConditionPair({
            gain: {
                id: '1',
                name: duplicate,
                choice: '1d6 Fire',
            },
        });

        const conditions = [
            firstCondition,
            createConditionPair({
                gain: {
                    id: '2',
                    name: duplicate,
                    choice: '1d6 Fire',
                },
            }),
        ];

        const source$ = removeSuperfluousConditions$(conditions)
            .pipe(
                take(2),
                map(result => result.map(({ gain }) => gain.id)),
                share(),
            );

        const expectedFirst = ['1'];
        const expectedLast = ['1', '2'];

        firstValueFrom(source$).then(result => {
            expect(result).toEqual(expectedFirst);
            firstCondition.gain.choice = '1d6 Cold';
        });
        lastValueFrom(source$).then(result => {
            expect(result).toEqual(expectedLast);
            done();
        });
    });

    it('should update conditions when values change', done => {
        const duplicate = 'duplicate';

        const higherCondition = createConditionPair({
            gain: {
                id: 'higher',
                name: duplicate,
                value: 10,
            },
        });

        const conditions = [
            createConditionPair({
                gain: {
                    id: 'lower',
                    name: duplicate,
                    value: 5,
                },
            }),
            higherCondition,
        ];

        const source$ = removeSuperfluousConditions$(conditions)
            .pipe(
                take(2),
                map(result => result.map(({ gain }) => gain.id)),
                share(),
            );

        const expectedFirst = ['higher'];
        const expectedLast = ['lower'];

        firstValueFrom(source$).then(result => {
            expect(result).toEqual(expectedFirst);
            higherCondition.gain.value = 1;
        });
        lastValueFrom(source$).then(result => {
            expect(result).toEqual(expectedLast);
            done();
        });
    });

    it('should update conditions when durations change', done => {
        const duplicate = 'duplicate';

        const longerCondition = createConditionPair({
            gain: {
                id: 'longer',
                name: duplicate,
                duration: 100,
            },
        });

        const conditions = [
            createConditionPair({
                gain: {
                    id: 'shorter',
                    name: duplicate,
                    duration: 50,
                },
            }),
            longerCondition,
        ];

        const source$ = removeSuperfluousConditions$(conditions)
            .pipe(
                take(2),
                map(result => result.map(({ gain }) => gain.id)),
                share(),
            );

        const expectedFirst = ['longer'];
        const expectedLast = ['shorter'];

        firstValueFrom(source$).then(result => {
            expect(result).toEqual(expectedFirst);
            longerCondition.gain.duration = 10;
        });
        lastValueFrom(source$).then(result => {
            expect(result).toEqual(expectedLast);
            done();
        });
    });
});
