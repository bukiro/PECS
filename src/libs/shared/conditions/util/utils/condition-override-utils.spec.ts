import { computed } from '@angular/core';
import { Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { ConditionOverride, Condition } from '../models/condition';
import { ConditionGain } from '../models/condition-gain';
import { applyConditionOverridesAndPauses$$ } from './condition-override-utils';
import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';


describe('applyConditionOverridesAndPauses', () => {
    const createConditionGain = ({
        gain, overrides, pauses,
    }: {
        gain: Serialized<ConditionGain>;
        overrides?: Array<ConditionOverride>;
        pauses?: Array<ConditionOverride>;
    }): ConditionGain => ConditionGain.from(
        gain,
        mockRecastFns({
            condition: Condition.from(
                {
                    name: gain.name,
                    overrideConditions: overrides,
                    pauseConditions: pauses,
                },
                mockRecastFns(),
            ),
        }),
    );

    it('should sort conditions by amount of children', () => {
        const conditions = [
            // A condition without parents, should remain in the same order with '3'
            createConditionGain({ gain: { id: '1' } }),
            // A condition with two parents ('2', then '3'), should be last
            createConditionGain({ gain: { id: '4', parentID: '2' } }),
            // A condition with one parent, should be after those with no parents
            createConditionGain({ gain: { id: '2', parentID: '3' } }),
            // A condition with no parents, should remain in the same order with '1'
            createConditionGain({ gain: { id: '3' } }),
        ];

        const result = applyConditionOverridesAndPauses$$(conditions)();
        const expected = ['1', '3', '2', '4'];

        expect(
            result.map(({ gain }) => gain.id),
        ).toEqual(expected);
    });

    it('should remove conditions that are overridden by name', () => {
        const conditions = [
            createConditionGain({ gain: { name: '1' }, overrides: [{ name: '2' }] }),
            createConditionGain({ gain: { name: '2' } }),
            createConditionGain({ gain: { name: '3' } }),
            createConditionGain({ gain: { name: '4' } }),
        ];

        const result = applyConditionOverridesAndPauses$$(conditions)();
        const expected = ['1', '3', '4'];

        expect(
            result.map(({ gain }) => gain.name),
        ).toEqual(expected);
    });

    it('should remove conditions that are overridden by "all"', () => {
        const conditions = [
            createConditionGain({ gain: { name: '1' }, overrides: [{ name: 'all' }] }),
            createConditionGain({ gain: { name: '2' } }),
            createConditionGain({ gain: { name: '3' } }),
            createConditionGain({ gain: { name: '4' } }),
        ];

        const result = applyConditionOverridesAndPauses$$(conditions)();
        const expected = ['1'];

        expect(
            result.map(({ gain }) => gain.name),
        ).toEqual(expected);
    });

    it('should first remove conditions and overrides that are overridden if they override "all"', () => {
        const conditions = [
            createConditionGain({ gain: { name: '1' }, overrides: [{ name: '2' }] }),
            // This override should not apply, leaving all other conditions remaining.
            createConditionGain({ gain: { name: '2' }, overrides: [{ name: 'all' }] }),
            createConditionGain({ gain: { name: '3' } }),
            createConditionGain({ gain: { name: '4' } }),
        ];

        const result = applyConditionOverridesAndPauses$$(conditions)();
        const expected = ['1', '3', '4'];

        expect(
            result.map(({ gain }) => gain.name),
        ).toEqual(expected);
    });

    it('should not remove overrides if their overrides are overridden', () => {
        const conditions = [
            // '1' is overriden by '2', but '2' is overridden by '3'.
            // It should not be removed, and it should be applied to remove '4'.
            createConditionGain({ gain: { name: '1' }, overrides: [{ name: '4' }] }),
            // '2' is overridden by '3' and should be removed and not applied.
            createConditionGain({ gain: { name: '2' }, overrides: [{ name: '1' }] }),
            createConditionGain({ gain: { name: '3' }, overrides: [{ name: '2' }] }),
            createConditionGain({ gain: { name: '4' } }),
        ];

        const result = applyConditionOverridesAndPauses$$(conditions)();
        const expected = ['1', '3'];

        expect(
            result.map(({ gain }) => gain.name),
        ).toEqual(expected);
    });

    it('should remove every other condition in an even-numbered circular override chain', () => {
        const conditions = [
            createConditionGain({ gain: { name: '1' }, overrides: [{ name: '4' }] }),
            createConditionGain({ gain: { name: '2' }, overrides: [{ name: '1' }] }),
            createConditionGain({ gain: { name: '3' }, overrides: [{ name: '2' }] }),
            createConditionGain({ gain: { name: '4' }, overrides: [{ name: '3' }] }),
        ];

        const result = applyConditionOverridesAndPauses$$(conditions)();
        const expected = ['2', '4'];

        expect(
            result.map(({ gain }) => gain.name),
        ).toEqual(expected);
    });

    it('should cancel all conditions in an odd-numbered circular override chain', () => {
        const conditions = [
            createConditionGain({ gain: { name: '1' }, overrides: [{ name: '3' }] }),
            createConditionGain({ gain: { name: '2' }, overrides: [{ name: '1' }] }),
            createConditionGain({ gain: { name: '3' }, overrides: [{ name: '2' }] }),
            createConditionGain({ gain: { name: '4' } }),
        ];

        const result = applyConditionOverridesAndPauses$$(conditions)();
        const expected = ['4'];

        expect(
            result.map(({ gain }) => gain.name),
        ).toEqual(expected);
    });

    it('should update overrides when choices change', () => {
        const choiceCondition = createConditionGain({
            gain: { name: '1', choice: 'override' },
            overrides: [{ name: '2', conditionChoiceFilter: ['override'] }],
        });

        const conditions = [
            choiceCondition,
            createConditionGain({ gain: { name: '2' } }),
        ];

        const result = computed(() =>
            applyConditionOverridesAndPauses$$(conditions)()
                .map(({ gain }) => gain.name),
        );

        const expectedFirst = ['1'];
        const expectedLast = ['1', '2'];

        expect(result()).toEqual(expectedFirst);

        choiceCondition.choice.set('');

        expect(result()).toEqual(expectedLast);
    });

    it('should pause conditions that are paused by name', () => {
        const conditions = [
            createConditionGain({ gain: { name: '1' }, pauses: [{ name: '2' }] }),
            createConditionGain({ gain: { name: '2' }, pauses: [{ name: '3' }] }),
            createConditionGain({ gain: { name: '3' } }),
            createConditionGain({ gain: { name: '4' } }),
        ];

        const result = applyConditionOverridesAndPauses$$(conditions)();
        const expectedPaused = ['2', '3'];

        expect(
            result.filter(({ paused }) => paused).map(({ gain }) => gain.name),
        ).toEqual(expectedPaused);
    });

    it('should pause conditions that are paused by "all"', () => {
        const conditions = [
            createConditionGain({ gain: { name: '1' }, pauses: [{ name: 'all' }] }),
            createConditionGain({ gain: { name: '2' } }),
            createConditionGain({ gain: { name: '3' } }),
            createConditionGain({ gain: { name: '4' } }),
        ];

        const result = applyConditionOverridesAndPauses$$(conditions)();
        const expectedPaused = ['2', '3', '4'];

        expect(
            result.filter(({ paused }) => paused).map(({ gain }) => gain.name),
        ).toEqual(expectedPaused);
    });

    it('should ignore pauses caused by overridden conditions', () => {
        const conditions = [
            createConditionGain({ gain: { name: '1' }, pauses: [{ name: 'all' }] }),
            createConditionGain({ gain: { name: '2' }, overrides: [{ name: '1' }] }),
            createConditionGain({ gain: { name: '3' } }),
            createConditionGain({ gain: { name: '4' } }),
        ];

        const result = applyConditionOverridesAndPauses$$(conditions)();

        expect(
            result.filter(({ paused }) => paused).map(({ gain }) => gain.name),
        ).toEqual([]);
    });

    it('should not ignore pauses caused by paused conditions', () => {
        const conditions = [
            createConditionGain({ gain: { name: '1' }, pauses: [{ name: 'all' }] }),
            createConditionGain({ gain: { name: '2' }, pauses: [{ name: '2' }] }),
            createConditionGain({ gain: { name: '3' } }),
            createConditionGain({ gain: { name: '4' } }),
        ];

        const result = applyConditionOverridesAndPauses$$(conditions)();
        const expectedPaused = ['2', '3', '4'];

        expect(
            result.filter(({ paused }) => paused).map(({ gain }) => gain.name),
        ).toEqual(expectedPaused);
    });

    it('should update pauses when choices change', () => {
        const choiceCondition = createConditionGain({
            gain: { name: '1', choice: 'pause' },
            pauses: [{ name: '2', conditionChoiceFilter: ['pause'] }],
        });

        const conditions = [
            choiceCondition,
            createConditionGain({ gain: { name: '2' } }),
        ];

        const result = computed(() =>
            applyConditionOverridesAndPauses$$(conditions)()
                .filter(({ paused }) => paused)
                .map(({ gain }) => gain.name),
        );

        const expectedFirst = ['2'];
        const expectedLast: Array<string> = [];


        expect(result()).toEqual(expectedFirst);

        choiceCondition.choice.set('');

        expect(result()).toEqual(expectedLast);
    });
});
