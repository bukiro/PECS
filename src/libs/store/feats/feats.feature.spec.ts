import { FeatTaken } from 'src/libs/shared/definitions/models/feat-taken';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { mockRecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { FeatsStore } from './feats.store';
import { TestBed } from '@angular/core/testing';
import { Type } from '@angular/core';

type UnpackType<T extends Type<unknown>> = T extends Type<infer I> ? I : never;

describe('featsFeature', () => {

    let testStore: UnpackType<typeof FeatsStore>;

    beforeEach(() => {
        testStore = TestBed.inject(FeatsStore);
    });

    const level = 5;

    const setup = ({ countAsFeat, superType, levelNumber }: { countAsFeat?: string; superType?: string; levelNumber: number }): {
        gain: FeatTaken;
        feat: Feat;
        addAction: { feat: Feat; gain: FeatTaken; levelNumber: number; temporary: boolean };
        removeAction: { gain: FeatTaken; levelNumber: number };
    } => {
        const name = 'name';
        // countAsFeat on the gain is set at runtime from the countAsFeat OR the superType property of the feat.
        const gain = new FeatTaken().with({ name, countAsFeat: countAsFeat ?? superType });
        const feat = new Feat().with({ name, countAsFeat, superType }, mockRecastFns());
        const isTemporary = false;
        const addAction = { feat, gain, levelNumber, temporary: isTemporary };
        const removeAction = { gain, levelNumber };

        return {
            gain, feat, addAction, removeAction,
        };
    };

    describe('reset action', () => {
        it('should remove all entries', () => {
            const { feat, addAction } = setup({ levelNumber: level, countAsFeat: 'countAsFeat' });

            testStore.addFeatAtLevel(addAction);

            expect(testStore.levelTakenFeats()[level]?.[feat.name.toLowerCase()]).toEqual(feat);
            expect(testStore.characterFeatsTaken()).toEqual(expect.arrayContaining([expect.objectContaining({
                feat,
            })]));
            expect(testStore.levelFeats()[level]?.[feat.name.toLowerCase()]).toBe(feat);
            expect(testStore.levelCountAs()[level]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);

            testStore.reset();

            expect(testStore.levelTakenFeats()[level]?.[feat.name.toLowerCase()]).toBeFalsy();
            expect(testStore.characterFeatsTaken()).not.toEqual(expect.arrayContaining([expect.objectContaining({
                feat,
            })]));
            expect(testStore.levelFeats()[level]?.[feat.name.toLowerCase()]).toBeFalsy();
            expect(testStore.levelCountAs()[level]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
        });
    });

    describe('addFeatAtLevel action', () => {

        const {
            feat: commonFeat,
            gain: commonGain,
            addAction: commonAddAction,
        } = setup({ levelNumber: level });

        it('should add the feat to levelTakenFeats on the exact levelNumber', () => {
            testStore.addFeatAtLevel(commonAddAction);

            expect(testStore.levelTakenFeats()[level]?.[commonFeat.name.toLowerCase()]).toEqual(commonFeat);
        });

        it('should add the gain to characterFeatsTaken', () => {
            testStore.addFeatAtLevel(commonAddAction);

            expect(testStore.characterFeatsTaken()).toEqual(expect.arrayContaining([expect.objectContaining({
                levelNumber: level,
                gain: commonGain,
                feat: commonFeat,
            })]));
        });

        it('should add the feat to levelFeats on all levels upwards from the levelNumber', () => {
            testStore.addFeatAtLevel(commonAddAction);

            expect(testStore.levelFeats()[1]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
            expect(testStore.levelFeats()[level]?.[commonFeat.name.toLowerCase()]).toBe(commonFeat);
            expect(testStore.levelFeats()[10]?.[commonFeat.name.toLowerCase()]).toBe(commonFeat);
            expect(testStore.levelFeats()[20]?.[commonFeat.name.toLowerCase()]).toBe(commonFeat);
        });

        it('should mark the feat in levelCountAs on all levels upwards from the levelNumber if countAsFeat is set', () => {
            const { feat, addAction } = setup({ levelNumber: level, countAsFeat: 'countAsFeat' });

            testStore.addFeatAtLevel(addAction);

            expect(testStore.levelCountAs()[1]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
            expect(testStore.levelCountAs()[level]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
            expect(testStore.levelCountAs()[10]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
            expect(testStore.levelCountAs()[20]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
        });

        it('should mark the feat in levelCountAs on all levels upwards from the levelNumber if superType is set', () => {
            const { feat, addAction } = setup({ levelNumber: level, superType: 'superType' });

            testStore.addFeatAtLevel(addAction);

            expect(testStore.levelCountAs()[1]?.[feat.superType.toLowerCase()]).toBeFalsy();
            expect(testStore.levelCountAs()[level]?.[feat.superType.toLowerCase()]).toEqual(true);
            expect(testStore.levelCountAs()[10]?.[feat.superType.toLowerCase()]).toEqual(true);
            expect(testStore.levelCountAs()[20]?.[feat.superType.toLowerCase()]).toEqual(true);
        });
    });

    describe('removeFeatAtLevel action', () => {

        const higherLevel = 10;
        const {
            feat: commonFeat,
            gain: commonGain,
            addAction: commonAddAction,
            removeAction: commonRemoveAction,
        } = setup({ levelNumber: level });

        it('should remove the feat from levelTakenFeats on the exact levelNumber if no other instances exist', () => {
            testStore.addFeatAtLevel(commonAddAction);

            expect(testStore.levelTakenFeats()[level]?.[commonFeat.name.toLowerCase()]).toEqual(commonFeat);

            testStore.removeFeatAtLevel(commonRemoveAction);

            expect(testStore.levelTakenFeats()[level]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
        });

        it('should not remove the feat from levelTakenFeats on the exact levelNumber if other instances exist', () => {
            const { addAction } = setup({ levelNumber: level });

            testStore.addFeatAtLevel(commonAddAction);
            testStore.addFeatAtLevel(addAction);

            expect(testStore.levelTakenFeats()[level]?.[commonFeat.name.toLowerCase()]).toEqual(commonFeat);

            testStore.removeFeatAtLevel(commonRemoveAction);

            expect(testStore.levelTakenFeats()[level]?.[commonFeat.name.toLowerCase()]).toEqual(commonFeat);
        });

        it('should remove the gain from characterFeatsTaken', () => {
            testStore.addFeatAtLevel(commonAddAction);

            expect(testStore.characterFeatsTaken()).toEqual(expect.arrayContaining([expect.objectContaining({
                levelNumber: level,
                gain: commonGain,
                feat: commonFeat,
            })]));

            testStore.removeFeatAtLevel(commonRemoveAction);

            expect(testStore.characterFeatsTaken()).not.toEqual(expect.arrayContaining([expect.objectContaining({
                levelNumber: level,
                gain: commonGain,
                feat: commonFeat,
            })]));
        });

        describe('if the feat is not taken on higher levels', () => {
            it('should remove the feat from levelFeats on all levels upwards from the levelNumber', () => {
                testStore.addFeatAtLevel(commonAddAction);

                expect(testStore.levelFeats()[1]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
                expect(testStore.levelFeats()[level]?.[commonFeat.name.toLowerCase()]).toBe(commonFeat);
                expect(testStore.levelFeats()[10]?.[commonFeat.name.toLowerCase()]).toBe(commonFeat);
                expect(testStore.levelFeats()[20]?.[commonFeat.name.toLowerCase()]).toBe(commonFeat);

                testStore.removeFeatAtLevel(commonRemoveAction);

                expect(testStore.levelFeats()[1]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
                expect(testStore.levelFeats()[level]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
                expect(testStore.levelFeats()[higherLevel]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
                expect(testStore.levelFeats()[20]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
            });

            it('should remove the feat from levelCountAs on all levels upwards from the levelNumber if countAsFeat is set', () => {
                const { feat, addAction, removeAction } = setup({ levelNumber: level, countAsFeat: 'countAsFeat' });

                testStore.addFeatAtLevel(addAction);

                expect(testStore.levelCountAs()[1]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
                expect(testStore.levelCountAs()[level]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
                expect(testStore.levelCountAs()[higherLevel]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
                expect(testStore.levelCountAs()[20]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);

                testStore.removeFeatAtLevel(removeAction);

                expect(testStore.levelCountAs()[1]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
                expect(testStore.levelCountAs()[level]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
                expect(testStore.levelCountAs()[higherLevel]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
                expect(testStore.levelCountAs()[20]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
            });

            it('should remove the feat from levelCountAs on all levels upwards from the levelNumber if superType is set', () => {
                const { feat, addAction, removeAction } = setup({ levelNumber: level, superType: 'superType' });

                testStore.addFeatAtLevel(addAction);

                expect(testStore.levelCountAs()[1]?.[feat.superType.toLowerCase()]).toBeFalsy();
                expect(testStore.levelCountAs()[level]?.[feat.superType.toLowerCase()]).toEqual(true);
                expect(testStore.levelCountAs()[higherLevel]?.[feat.superType.toLowerCase()]).toEqual(true);
                expect(testStore.levelCountAs()[20]?.[feat.superType.toLowerCase()]).toEqual(true);

                testStore.removeFeatAtLevel(removeAction);

                expect(testStore.levelCountAs()[1]?.[feat.superType.toLowerCase()]).toBeFalsy();
                expect(testStore.levelCountAs()[level]?.[feat.superType.toLowerCase()]).toBeFalsy();
                expect(testStore.levelCountAs()[higherLevel]?.[feat.superType.toLowerCase()]).toBeFalsy();
                expect(testStore.levelCountAs()[20]?.[feat.superType.toLowerCase()]).toBeFalsy();
            });
        });

        describe('if the feat is taken on higher levels', () => {
            it('should remove the feat from levelFeats on all levels upwards from the levelNumber up to the higher levelNumber', () => {
                const { addAction } = setup({ levelNumber: higherLevel });

                testStore.addFeatAtLevel(commonAddAction);
                testStore.addFeatAtLevel({ ...addAction, feat: commonFeat });

                expect(testStore.levelFeats()[1]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
                expect(testStore.levelFeats()[level]?.[commonFeat.name.toLowerCase()]).toBe(commonFeat);
                expect(testStore.levelFeats()[10]?.[commonFeat.name.toLowerCase()]).toBe(commonFeat);
                expect(testStore.levelFeats()[20]?.[commonFeat.name.toLowerCase()]).toBe(commonFeat);

                testStore.removeFeatAtLevel(commonRemoveAction);

                expect(testStore.levelFeats()[1]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
                expect(testStore.levelFeats()[level]?.[commonFeat.name.toLowerCase()]).toBeFalsy();
                expect(testStore.levelFeats()[higherLevel]?.[commonFeat.name.toLowerCase()]).toEqual(commonFeat);
                expect(testStore.levelFeats()[20]?.[commonFeat.name.toLowerCase()]).toEqual(commonFeat);
            });

            it('should remove the feat from levelCountAs on all levels upwards from the levelNumber if countAsFeat is set', () => {
                const { feat, addAction, removeAction } = setup({ levelNumber: level, countAsFeat: 'countAsFeat' });
                const { addAction: higherAddAction } = setup({ levelNumber: higherLevel, countAsFeat: 'countAsFeat' });

                testStore.addFeatAtLevel(addAction);
                testStore.addFeatAtLevel(higherAddAction);

                expect(testStore.levelCountAs()[1]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
                expect(testStore.levelCountAs()[level]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
                expect(testStore.levelCountAs()[higherLevel]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
                expect(testStore.levelCountAs()[20]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);

                testStore.removeFeatAtLevel(removeAction);

                expect(testStore.levelCountAs()[1]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
                expect(testStore.levelCountAs()[level]?.[feat.countAsFeat.toLowerCase()]).toBeFalsy();
                expect(testStore.levelCountAs()[higherLevel]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
                expect(testStore.levelCountAs()[20]?.[feat.countAsFeat.toLowerCase()]).toEqual(true);
            });

            it('should remove the feat from levelCountAs on all levels upwards from the levelNumber if superType is set', () => {
                const { feat, addAction, removeAction } = setup({ levelNumber: level, superType: 'superType' });
                const { addAction: higherAddAction } = setup({ levelNumber: higherLevel, superType: 'superType' });

                testStore.addFeatAtLevel(addAction);
                testStore.addFeatAtLevel(higherAddAction);

                expect(testStore.levelCountAs()[1]?.[feat.superType.toLowerCase()]).toBeFalsy();
                expect(testStore.levelCountAs()[level]?.[feat.superType.toLowerCase()]).toEqual(true);
                expect(testStore.levelCountAs()[higherLevel]?.[feat.superType.toLowerCase()]).toEqual(true);
                expect(testStore.levelCountAs()[20]?.[feat.superType.toLowerCase()]).toEqual(true);

                testStore.removeFeatAtLevel(removeAction);

                expect(testStore.levelCountAs()[1]?.[feat.superType.toLowerCase()]).toBeFalsy();
                expect(testStore.levelCountAs()[level]?.[feat.superType.toLowerCase()]).toBeFalsy();
                expect(testStore.levelCountAs()[higherLevel]?.[feat.superType.toLowerCase()]).toEqual(true);
                expect(testStore.levelCountAs()[20]?.[feat.superType.toLowerCase()]).toEqual(true);
            });
        });
    });
});
