import { Condition, ConditionOverride } from 'src/app/classes/conditions/condition';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { ConditionGainPair } from './condition-gain-pair';
import { mockRecastFns } from '../../definitions/interfaces/recast-fns';
import { applyConditionOverridesAndPauses$$ } from './condition-override-utils';
import { firstValueFrom, lastValueFrom, map, share, take } from 'rxjs';

const recastFns = mockRecastFns();

describe('applyConditionOverridesAndPauses', () => {
    const createConditionPair = ({
        gain, overrides, pauses,
    }: {
        gain: Partial<ConditionGain>;
        overrides?: Array<ConditionOverride>;
        pauses?: Array<ConditionOverride>;
    }): ConditionGainPair => ({
        gain: ConditionGain.from(gain, recastFns),
        condition: Condition.from(
            {
                name: gain.name,
                overrideConditions: overrides,
                pauseConditions: pauses,
            },
            recastFns),
    });

    it('should sort conditions by amount of children', async () => {
        const conditions = [
            // A condition without parents, should remain in the same order with '3'
            createConditionPair({ gain: { id: '1' } }),
            // A condition with two parents ('2', then '3'), should be last
            createConditionPair({ gain: { id: '4', parentID: '2' } }),
            // A condition with one parent, should be after those with no parents
            createConditionPair({ gain: { id: '2', parentID: '3' } }),
            // A condition with no parents, should remain in the same order with '1'
            createConditionPair({ gain: { id: '3' } }),
        ];

        const result = await firstValueFrom(applyConditionOverridesAndPauses$$(conditions));
        const expected = ['1', '3', '2', '4'];

        expect(
            result.map(({ gain }) => gain.id),
        ).toEqual(expected);
    });

    it('should remove conditions that are overridden by name', async () => {
        const conditions = [
            createConditionPair({ gain: { name: '1' }, overrides: [{ name: '2' }] }),
            createConditionPair({ gain: { name: '2' } }),
            createConditionPair({ gain: { name: '3' } }),
            createConditionPair({ gain: { name: '4' } }),
        ];

        const result = await firstValueFrom(applyConditionOverridesAndPauses$$(conditions));
        const expected = ['1', '3', '4'];

        expect(
            result.map(({ gain }) => gain.name),
        ).toEqual(expected);
    });

    it('should remove conditions that are overridden by "all"', async () => {
        const conditions = [
            createConditionPair({ gain: { name: '1' }, overrides: [{ name: 'all' }] }),
            createConditionPair({ gain: { name: '2' } }),
            createConditionPair({ gain: { name: '3' } }),
            createConditionPair({ gain: { name: '4' } }),
        ];

        const result = await firstValueFrom(applyConditionOverridesAndPauses$$(conditions));
        const expected = ['1'];

        expect(
            result.map(({ gain }) => gain.name),
        ).toEqual(expected);
    });

    it('should first remove conditions and overrides that are overridden if they override "all"', async () => {
        const conditions = [
            createConditionPair({ gain: { name: '1' }, overrides: [{ name: '2' }] }),
            // This override should not apply, leaving all other conditions remaining.
            createConditionPair({ gain: { name: '2' }, overrides: [{ name: 'all' }] }),
            createConditionPair({ gain: { name: '3' } }),
            createConditionPair({ gain: { name: '4' } }),
        ];

        const result = await firstValueFrom(applyConditionOverridesAndPauses$$(conditions));
        const expected = ['1', '3', '4'];

        expect(
            result.map(({ gain }) => gain.name),
        ).toEqual(expected);
    });

    it('should not remove overrides if their overrides are overridden', async () => {
        const conditions = [
            // '1' is overriden by '2', but '2' is overridden by '3'.
            // It should not be removed, and it should be applied to remove '4'.
            createConditionPair({ gain: { name: '1' }, overrides: [{ name: '4' }] }),
            // '2' is overridden by '3' and should be removed and not applied.
            createConditionPair({ gain: { name: '2' }, overrides: [{ name: '1' }] }),
            createConditionPair({ gain: { name: '3' }, overrides: [{ name: '2' }] }),
            createConditionPair({ gain: { name: '4' } }),
        ];

        const result = await firstValueFrom(applyConditionOverridesAndPauses$$(conditions));
        const expected = ['1', '3'];

        expect(
            result.map(({ gain }) => gain.name),
        ).toEqual(expected);
    });

    it('should remove every other condition in an even-numbered circular override chain', async () => {
        const conditions = [
            createConditionPair({ gain: { name: '1' }, overrides: [{ name: '4' }] }),
            createConditionPair({ gain: { name: '2' }, overrides: [{ name: '1' }] }),
            createConditionPair({ gain: { name: '3' }, overrides: [{ name: '2' }] }),
            createConditionPair({ gain: { name: '4' }, overrides: [{ name: '3' }] }),
        ];

        const result = await firstValueFrom(applyConditionOverridesAndPauses$$(conditions));
        const expected = ['2', '4'];

        expect(
            result.map(({ gain }) => gain.name),
        ).toEqual(expected);
    });

    it('should cancel all conditions in an odd-numbered circular override chain', async () => {
        const conditions = [
            createConditionPair({ gain: { name: '1' }, overrides: [{ name: '3' }] }),
            createConditionPair({ gain: { name: '2' }, overrides: [{ name: '1' }] }),
            createConditionPair({ gain: { name: '3' }, overrides: [{ name: '2' }] }),
            createConditionPair({ gain: { name: '4' } }),
        ];

        const result = await firstValueFrom(applyConditionOverridesAndPauses$$(conditions));
        const expected = ['4'];

        expect(
            result.map(({ gain }) => gain.name),
        ).toEqual(expected);
    });

    it('should update overrides when choices change', done => {
        const choiceCondition = createConditionPair({
            gain: { name: '1', choice: 'override' },
            overrides: [{ name: '2', conditionChoiceFilter: ['override'] }],
        });

        const conditions = [
            choiceCondition,
            createConditionPair({ gain: { name: '2' } }),
        ];

        const source$ = applyConditionOverridesAndPauses$$(conditions)
            .pipe(
                take(2),
                map(result => result.map(({ gain }) => gain.name)),
            );

        const expectedFirst = ['1'];
        const expectedLast = ['1', '2'];

        firstValueFrom(source$).then(result => {
            expect(result).toEqual(expectedFirst);
            choiceCondition.gain.choice = '';
        });
        lastValueFrom(source$).then(result => {
            expect(result).toEqual(expectedLast);
            done();
        });
    });

    it('should pause conditions that are paused by name', async () => {
        const conditions = [
            createConditionPair({ gain: { name: '1' }, pauses: [{ name: '2' }] }),
            createConditionPair({ gain: { name: '2' }, pauses: [{ name: '3' }] }),
            createConditionPair({ gain: { name: '3' } }),
            createConditionPair({ gain: { name: '4' } }),
        ];

        const result = await firstValueFrom(applyConditionOverridesAndPauses$$(conditions));
        const expectedPaused = ['2', '3'];

        expect(
            result.filter(({ paused }) => paused).map(({ gain }) => gain.name),
        ).toEqual(expectedPaused);
    });

    it('should pause conditions that are paused by "all"', async () => {
        const conditions = [
            createConditionPair({ gain: { name: '1' }, pauses: [{ name: 'all' }] }),
            createConditionPair({ gain: { name: '2' } }),
            createConditionPair({ gain: { name: '3' } }),
            createConditionPair({ gain: { name: '4' } }),
        ];

        const result = await firstValueFrom(applyConditionOverridesAndPauses$$(conditions));
        const expectedPaused = ['2', '3', '4'];

        expect(
            result.filter(({ paused }) => paused).map(({ gain }) => gain.name),
        ).toEqual(expectedPaused);
    });

    it('should ignore pauses caused by overridden conditions', async () => {
        const conditions = [
            createConditionPair({ gain: { name: '1' }, pauses: [{ name: 'all' }] }),
            createConditionPair({ gain: { name: '2' }, overrides: [{ name: '1' }] }),
            createConditionPair({ gain: { name: '3' } }),
            createConditionPair({ gain: { name: '4' } }),
        ];

        const result = await firstValueFrom(applyConditionOverridesAndPauses$$(conditions));

        expect(
            result.filter(({ paused }) => paused).map(({ gain }) => gain.name),
        ).toEqual([]);
    });

    it('should not ignore pauses caused by paused conditions', async () => {
        const conditions = [
            createConditionPair({ gain: { name: '1' }, pauses: [{ name: 'all' }] }),
            createConditionPair({ gain: { name: '2' }, pauses: [{ name: '2' }] }),
            createConditionPair({ gain: { name: '3' } }),
            createConditionPair({ gain: { name: '4' } }),
        ];

        const result = await firstValueFrom(applyConditionOverridesAndPauses$$(conditions));
        const expectedPaused = ['2', '3', '4'];

        expect(
            result.filter(({ paused }) => paused).map(({ gain }) => gain.name),
        ).toEqual(expectedPaused);
    });

    it('should update pauses when choices change', done => {
        const choiceCondition = createConditionPair({
            gain: { name: '1', choice: 'pause' },
            pauses: [{ name: '2', conditionChoiceFilter: ['pause'] }],
        });

        const conditions = [
            choiceCondition,
            createConditionPair({ gain: { name: '2' } }),
        ];

        const source$ = applyConditionOverridesAndPauses$$(conditions)
            .pipe(
                take(2),
                map(result => result.filter(({ paused }) => paused).map(({ gain }) => gain.name)),
                share(),
            );

        const expectedFirst = ['2'];
        const expectedLast: Array<string> = [];

        firstValueFrom(source$).then(result => {
            expect(result).toEqual(expectedFirst);
            choiceCondition.gain.choice = '';
        });
        lastValueFrom(source$).then(result => {
            expect(result).toEqual(expectedLast);
            done();
        });
    });
});
