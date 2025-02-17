import { FeatTaken } from 'src/libs/shared/definitions/models/feat-taken';
import { addFeatAtLevel, removeFeatAtLevel, resetFeats } from './feats.actions';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { featsFeature, initialState } from './feats.feature';
import { mockRecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Action } from '@ngrx/store';
import { resetCharacter } from '../character/character.actions';

describe('featsFeature', () => {

    const level = 5;

    const setup = ({ countAsFeat, superType, levelNumber }: { countAsFeat?: string; superType?: string; levelNumber: number }): {
        gain: FeatTaken;
        feat: Feat;
        addAction: Action;
        removeAction: Action;
    } => {
        const name = 'name';
        // countAsFeat on the gain is set at runtime from the countAsFeat OR the superType property of the feat.
        const gain = new FeatTaken().with({ name, countAsFeat: countAsFeat ?? superType });
        const feat = new Feat().with({ name, countAsFeat, superType }, mockRecastFns());
        const isTemporary = false;
        const addAction = addFeatAtLevel({ feat, gain, levelNumber, temporary: isTemporary });
        const removeAction = removeFeatAtLevel({ gain, levelNumber });

        return {
            gain, feat, addAction, removeAction,
        };
    };

    describe('resetCharacter action', () => {
        it('should remove all entries', () => {
            const { feat, addAction } = setup({ levelNumber: level, countAsFeat: 'countAsFeat' });

            const state = featsFeature.reducer(initialState, addAction);

            expect(state.levelTakenFeats[level]?.[feat.name.toLowerCase()]).toEqual(feat);
            expect(state.characterFeatsTaken).toEqual(expect.arrayContaining([expect.objectContaining({
                feat,
            })]));
            expect(state.levelFeats[level]?.[feat.name.toLowerCase()]).toBe(feat);
            expect(state.levelCountAs[level]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);

            const result = featsFeature.reducer(state, resetCharacter({}));

            expect(result).toEqual(initialState);
            expect(result.levelTakenFeats[level]?.[feat.name.toLowerCase()]).toBeFalsy();
            expect(result.characterFeatsTaken).not.toEqual(expect.arrayContaining([expect.objectContaining({
                feat,
            })]));
            expect(result.levelFeats[level]?.[feat.name.toLowerCase()]).toBeFalsy();
            expect(result.levelCountAs[level]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
        });
    });

    describe('resetFeats action', () => {
        it('should remove all entries', () => {
            const { feat, addAction } = setup({ levelNumber: level, countAsFeat: 'countAsFeat' });

            const state = featsFeature.reducer(initialState, addAction);

            expect(state.levelTakenFeats[level]?.[feat.name.toLowerCase()]).toEqual(feat);
            expect(state.characterFeatsTaken).toEqual(expect.arrayContaining([expect.objectContaining({
                feat,
            })]));
            expect(state.levelFeats[level]?.[feat.name.toLowerCase()]).toBe(feat);
            expect(state.levelCountAs[level]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);

            const result = featsFeature.reducer(state, resetFeats());

            expect(result).toEqual(initialState);
            expect(result.levelTakenFeats[level]?.[feat.name.toLowerCase()]).toBeFalsy();
            expect(result.characterFeatsTaken).not.toEqual(expect.arrayContaining([expect.objectContaining({
                feat,
            })]));
            expect(result.levelFeats[level]?.[feat.name.toLowerCase()]).toBeFalsy();
            expect(result.levelCountAs[level]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
        });
    });

    describe('addFeatAtLevel action', () => {

        const {
            feat: commonFeat,
            gain: commonGain,
            addAction: commonAddAction,
        } = setup({ levelNumber: level });

        const commonResult = featsFeature.reducer(initialState, commonAddAction);

        it('should add the feat to levelTakenFeats on the exact levelNumber', () => {
            expect(commonResult.levelTakenFeats[level]?.[commonFeat.name.toLowerCase()]).toEqual(commonFeat);
        });

        it('should add the gain to characterFeatsTaken', () => {
            expect(commonResult.characterFeatsTaken).toEqual(expect.arrayContaining([expect.objectContaining({
                levelNumber: level,
                gain: commonGain,
                feat: commonFeat,
            })]));
        });

        it('should add the feat to levelFeats on all levels upwards from the levelNumber', () => {
            expect(commonResult.levelFeats[1]?.[commonFeat.name.toLowerCase()]).toBe(undefined);
            expect(commonResult.levelFeats[level]?.[commonFeat.name.toLowerCase()]).toBe(commonFeat);
            expect(commonResult.levelFeats[10]?.[commonFeat.name.toLowerCase()]).toBe(commonFeat);
            expect(commonResult.levelFeats[20]?.[commonFeat.name.toLowerCase()]).toBe(commonFeat);
        });

        it('should mark the feat in levelCountAs on all levels upwards from the levelNumber if countAsFeat is set', () => {
            const { feat, addAction } = setup({ levelNumber: level, countAsFeat: 'countAsFeat' });

            const result = featsFeature.reducer(initialState, addAction);

            expect(result.levelCountAs[1]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
            expect(result.levelCountAs[level]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
            expect(result.levelCountAs[10]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
            expect(result.levelCountAs[20]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
        });

        it('should mark the feat in levelCountAs on all levels upwards from the levelNumber if superType is set', () => {
            const { feat, addAction } = setup({ levelNumber: level, superType: 'superType' });

            const result = featsFeature.reducer(initialState, addAction);

            expect(result.levelCountAs[1]?.[feat.superType.toLowerCase()]).toBeFalsy();
            expect(result.levelCountAs[level]?.[feat.superType.toLowerCase()]).toEqual(true);
            expect(result.levelCountAs[10]?.[feat.superType.toLowerCase()]).toEqual(true);
            expect(result.levelCountAs[20]?.[feat.superType.toLowerCase()]).toEqual(true);
        });
    });

    describe('removeFeatAtLevel action', () => {

        const higherLevel = 10;
        const { feat: commonFeat, gain: commonGain, removeAction: commonRemoveAction } = setup({ levelNumber: level });
        const stateWithFeat = featsFeature.reducer(
            initialState,
            addFeatAtLevel({ feat: commonFeat, gain: commonGain, levelNumber: level, temporary: false }),
        );

        const commonResult = featsFeature.reducer(stateWithFeat, commonRemoveAction);

        it('should remove the feat from levelTakenFeats on the exact levelNumber if no other instances exist', () => {
            expect(commonResult.levelTakenFeats[level]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
        });

        it('should not remove the feat from levelTakenFeats on the exact levelNumber if other instances exist', () => {
            const { gain: otherGain } = setup({ levelNumber: level });

            const stateWithTwoFeats = featsFeature.reducer(
                stateWithFeat,
                addFeatAtLevel({ feat: commonFeat, gain: otherGain, levelNumber: level, temporary: false }),
            );

            const result = featsFeature.reducer(stateWithTwoFeats, commonRemoveAction);

            expect(result.levelTakenFeats[level]?.[commonFeat.name.toLowerCase()]).toEqual(commonFeat);
        });

        it('should remove the gain from characterFeatsTaken', () => {
            expect(commonResult.characterFeatsTaken).not.toEqual(expect.arrayContaining([expect.objectContaining({
                levelNumber: level,
                gain: commonGain,
                feat: commonFeat,
            })]));
        });

        describe('if the feat is not taken on higher levels', () => {
            it('should remove the feat from levelFeats on all levels upwards from the levelNumber', () => {
                expect(commonResult.levelFeats[1]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
                expect(commonResult.levelFeats[level]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
                expect(commonResult.levelFeats[higherLevel]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
                expect(commonResult.levelFeats[20]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
            });

            it('should remove the feat from levelCountAs on all levels upwards from the levelNumber if countAsFeat is set', () => {
                const { feat, gain, removeAction } = setup({ levelNumber: level, countAsFeat: 'countAsFeat' });

                const state = featsFeature.reducer(
                    initialState,
                    addFeatAtLevel({ feat, gain, levelNumber: level, temporary: false }),
                );

                expect(state.levelCountAs[1]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
                expect(state.levelCountAs[level]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
                expect(state.levelCountAs[higherLevel]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
                expect(state.levelCountAs[20]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);

                const result = featsFeature.reducer(state, removeAction);

                expect(result.levelCountAs[1]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
                expect(result.levelCountAs[level]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
                expect(result.levelCountAs[higherLevel]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
                expect(result.levelCountAs[20]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
            });

            it('should remove the feat from levelCountAs on all levels upwards from the levelNumber if superType is set', () => {
                const { feat, gain, removeAction } = setup({ levelNumber: level, superType: 'superType' });

                const state = featsFeature.reducer(
                    initialState,
                    addFeatAtLevel({ feat, gain, levelNumber: level, temporary: false }),
                );

                expect(state.levelCountAs[1]?.[feat.superType.toLowerCase()]).toBeFalsy();
                expect(state.levelCountAs[level]?.[feat.superType.toLowerCase()]).toEqual(true);
                expect(state.levelCountAs[higherLevel]?.[feat.superType.toLowerCase()]).toEqual(true);
                expect(state.levelCountAs[20]?.[feat.superType.toLowerCase()]).toEqual(true);

                const result = featsFeature.reducer(state, removeAction);

                expect(result.levelCountAs[1]?.[feat.superType.toLowerCase()]).toBeFalsy();
                expect(result.levelCountAs[level]?.[feat.superType.toLowerCase()]).toBeFalsy();
                expect(result.levelCountAs[higherLevel]?.[feat.superType.toLowerCase()]).toBeFalsy();
                expect(result.levelCountAs[20]?.[feat.superType.toLowerCase()]).toBeFalsy();
            });
        });

        describe('if the feat is taken on higher levels', () => {
            it('should remove the feat from levelFeats on all levels upwards from the levelNumber up to the higher levelNumber', () => {
                const { gain: higherGain } = setup({ levelNumber: higherLevel });

                const state = featsFeature.reducer(
                    stateWithFeat,
                    addFeatAtLevel({ feat: commonFeat, gain: higherGain, levelNumber: higherLevel, temporary: false }),
                );

                expect(state.levelFeats[1]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
                expect(state.levelFeats[level]?.[commonFeat.name.toLowerCase()]).toEqual(commonFeat);
                expect(state.levelFeats[higherLevel]?.[commonFeat.name.toLowerCase()]).toEqual(commonFeat);
                expect(state.levelFeats[20]?.[commonFeat.name.toLowerCase()]).toEqual(commonFeat);

                const result = featsFeature.reducer(state, commonRemoveAction);

                expect(result.levelFeats[1]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
                expect(result.levelFeats[level]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
                expect(result.levelFeats[higherLevel]?.[commonFeat.name.toLowerCase()]).toEqual(commonFeat);
                expect(result.levelFeats[20]?.[commonFeat.name.toLowerCase()]).toEqual(commonFeat);
            });

            it('should remove the feat from levelCountAs on all levels upwards from the levelNumber if countAsFeat is set', () => {
                const { feat, gain, removeAction } = setup({ levelNumber: level, countAsFeat: 'countAsFeat' });
                const { gain: higherGain } = setup({ levelNumber: higherLevel, countAsFeat: 'countAsFeat' });

                const state = featsFeature.reducer(
                    initialState,
                    addFeatAtLevel({ feat, gain, levelNumber: level, temporary: false }),
                );

                const stateWithTwoFeats = featsFeature.reducer(
                    state,
                    addFeatAtLevel({ feat, gain: higherGain, levelNumber: higherLevel, temporary: false }),
                );

                expect(stateWithTwoFeats.levelCountAs[1]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
                expect(stateWithTwoFeats.levelCountAs[level]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
                expect(stateWithTwoFeats.levelCountAs[higherLevel]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
                expect(stateWithTwoFeats.levelCountAs[20]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);

                const result = featsFeature.reducer(stateWithTwoFeats, removeAction);

                expect(result.levelCountAs[1]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
                expect(result.levelCountAs[level]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
                expect(result.levelCountAs[higherLevel]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
                expect(result.levelCountAs[20]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
            });

            it('should remove the feat from levelCountAs on all levels upwards from the levelNumber if superType is set', () => {
                const { feat, gain, removeAction } = setup({ levelNumber: level, superType: 'superType' });
                const { gain: higherGain } = setup({ levelNumber: higherLevel, superType: 'superType' });

                const state = featsFeature.reducer(
                    initialState,
                    addFeatAtLevel({ feat, gain, levelNumber: level, temporary: false }),
                );

                const stateWithTwoFeats = featsFeature.reducer(
                    state,
                    addFeatAtLevel({ feat, gain: higherGain, levelNumber: higherLevel, temporary: false }),
                );

                expect(stateWithTwoFeats.levelCountAs[1]?.[feat.superType.toLowerCase()]).toBeFalsy();
                expect(stateWithTwoFeats.levelCountAs[level]?.[feat.superType.toLowerCase()]).toEqual(true);
                expect(stateWithTwoFeats.levelCountAs[higherLevel]?.[feat.superType.toLowerCase()]).toEqual(true);
                expect(stateWithTwoFeats.levelCountAs[20]?.[feat.superType.toLowerCase()]).toEqual(true);

                const result = featsFeature.reducer(stateWithTwoFeats, removeAction);

                expect(result.levelCountAs[1]?.[feat.superType.toLowerCase()]).toBeFalsy();
                expect(result.levelCountAs[level]?.[feat.superType.toLowerCase()]).toBeFalsy();
                expect(result.levelCountAs[higherLevel]?.[feat.superType.toLowerCase()]).toEqual(true);
                expect(result.levelCountAs[20]?.[feat.superType.toLowerCase()]).toEqual(true);
            });
        });
    });
});
