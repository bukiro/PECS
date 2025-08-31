import { Character } from 'src/libs/shared/character/util/models/character';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { CharacterClassLevel } from 'src/libs/shared/character/util/models/character-class-level';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { AnimalCompanionStage } from 'src/libs/shared/animal-companion/util/models/animal-companion-stage';
import { Feat } from 'src/libs/shared/feats/util/models/feat';
import { FeatChoice } from 'src/libs/shared/feats/util/models/feat-choice';
import { FeatGain } from 'src/libs/shared/feats/util/models/feat-gain';
import { AnimalCompanionSpecialization } from 'src/libs/shared/feats/util/models/animal-companion-specialization';
import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';
import { computed } from '@angular/core';
import { mockEmptySkillChoice, mockSkillType } from '../skill-testing-utils';
import { AnimalCompanionSkillChoicesAdapter } from './animal-companion-skill-choices-adapter';

describe('AnimalCompanionSkillChoicesAdapter', () => {
    let recastFns: RecastFns;
    let character: Character;
    let companion: AnimalCompanion;
    let adapter: AnimalCompanionSkillChoicesAdapter;

    beforeEach(() => {
        recastFns = mockRecastFns({
            stages: [
                AnimalCompanionStage.from({ name: 'A', skillChoices: [mockEmptySkillChoice.clone()] }),
                AnimalCompanionStage.from({ name: 'B', skillChoices: [mockEmptySkillChoice.clone()] }),
                AnimalCompanionStage.from({ name: 'C', skillChoices: [mockEmptySkillChoice.clone()] }),
            ],
        });
        character = new Character(recastFns);
        companion = character.class().animalCompanion();
        adapter = new AnimalCompanionSkillChoicesAdapter(companion);
    });

    describe('skillChoices$$', () => {
        it('should include the ancestry choices if minLevelNumber is unspecified', () => {
            companion.class().ancestry().skillChoices = [mockEmptySkillChoice.clone()];

            expect(adapter.skillChoices$$({})().length).toEqual(1);
        });

        it('should include the ancestry choices if minLevelNumber is 0', () => {
            companion.class().ancestry().skillChoices = [mockEmptySkillChoice.clone()];

            expect(adapter.skillChoices$$({ minLevelNumber: 0 })().length).toEqual(1);
        });

        it('should include the ancestry choices if minLevelNumber is 1', () => {
            companion.class().ancestry().skillChoices = [mockEmptySkillChoice.clone()];

            expect(adapter.skillChoices$$({ minLevelNumber: 1 })().length).toEqual(1);
        });

        it('should not include the ancestry choices if minLevelNumber is above 1', () => {
            companion.class().ancestry().skillChoices = [mockEmptySkillChoice.clone()];

            expect(adapter.skillChoices$$({ minLevelNumber: 2 })().length).toEqual(0);
        });

        it('should limit choices from stages to the stages available at the level', () => {
            character.class().levels.set([
                new CharacterClassLevel(),
                new CharacterClassLevel(),
                new CharacterClassLevel(),
                new CharacterClassLevel(),
                new CharacterClassLevel(),
            ]);

            const featA = Feat.from({ name: 'A', gainAnimalCompanion: 'A' }, recastFns);
            const featB = Feat.from({ name: 'B', gainAnimalCompanion: 'B' }, recastFns);

            // Fake Feats that grant animal companion stages, recastFns that link them and FeatGains that gain them.
            recastFns.getOriginalFeat$$ = ({ name }) => computed(() => name === 'A' ? featA : featB);

            character.class().levels()[2]?.featChoices.set([
                FeatChoice.from({ feats: [FeatGain.from({ name: 'A' }, recastFns)] }, recastFns),
            ]);

            character.class().levels()[4]?.featChoices.set([
                FeatChoice.from({ feats: [FeatGain.from({ name: 'B' }, recastFns)] }, recastFns),
            ]);

            // All mock stages contain one ability choice. Gaining stage 'A' at character level 2 and stage 'B' at character level 4
            // means that at character level 3 the companion only has stage 'A', with one choice in total.
            expect(adapter.skillChoices$$({ maxLevelNumber: 3 })().length).toEqual(1);
        });

        it('should limit choices from specializations to the stages available at the level', () => {
            const baseSpecialization = AnimalCompanionSpecialization.from({ skillChoices: [mockEmptySkillChoice.clone()] });

            companion.class().specializations.set([
                baseSpecialization.clone().with({ name: 'A', level: 2 }),
                baseSpecialization.clone().with({ name: 'B', level: 4 }),
            ]);

            expect(adapter.skillChoices$$({ maxLevelNumber: 3 })().length).toEqual(1);
        });

        it('should only allow one "first specialization" choice specializations', () => {
            const baseSpecialization = AnimalCompanionSpecialization.from({
                skillChoices: [mockEmptySkillChoice.clone().with({ source: 'First Specialization' })],
            });

            companion.class().specializations.set([
                baseSpecialization.clone().with({ name: 'A', level: 1 }),
                baseSpecialization.clone().with({ name: 'B', level: 2 }),
                baseSpecialization.clone().with({ name: 'C', level: 3 }),
            ]);

            expect(adapter.skillChoices$$({ maxLevelNumber: 3 })().length).toEqual(1);
        });

        it('should use the character level if not specified', () => {
            character.level.set(3);

            const baseSpecialization = AnimalCompanionSpecialization.from({ skillChoices: [mockEmptySkillChoice.clone()] });

            companion.class().specializations.set([
                baseSpecialization.clone().with({ name: 'A', level: 2 }),
                baseSpecialization.clone().with({ name: 'B', level: 4 }),
            ]);

            expect(adapter.skillChoices$$({})().length).toEqual(1);
        });

        it('should match the filter', () => {
            const baseSpecialization = AnimalCompanionSpecialization.from({
                skillChoices: [mockEmptySkillChoice.clone()],
            });

            const specializations = companion.class().specializations;

            specializations.set([
                baseSpecialization.clone().with({ name: 'A', level: 1 }),
                baseSpecialization.clone().with({ name: 'B', level: 2 }),
                baseSpecialization.clone().with({ name: 'C', level: 3 }),
                baseSpecialization.clone().with({ name: 'D', level: 4 }),
                baseSpecialization.clone().with({ name: 'E', level: 5 }),
            ]);

            const choice1 = specializations()[1]?.skillChoices[0];
            const choice2 = specializations()[2]?.skillChoices[0];
            const choice3 = specializations()[3]?.skillChoices[0];
            const choice4 = specializations()[4]?.skillChoices[0];
            const choice5 = specializations()[5]?.skillChoices[0];

            if (choice1) {
                choice1.type = mockSkillType;
                choice1.source = 'A';
                choice1.id = '1';
            }

            if (choice2) {
                choice2.type = 'Skill';
                choice2.source = 'A';
                choice2.id = '1';
            }

            if (choice3) {
                choice3.type = 'Skill';
                choice3.source = 'B';
                choice3.id = '1';
            }

            if (choice4) {
                choice4.type = 'Skill';
                choice4.source = 'B';
                choice4.id = '2';
            }

            if (choice5) {
                choice5.type = mockSkillType;
                choice5.source = 'B';
                choice5.id = '2';
            }

            expect(
                adapter.skillChoices$$(
                    {
                        maxLevelNumber: 5,
                    },
                    {
                        type: 'Skill',
                        source: 'A',
                        id: '1',
                    },
                )(),
            ).toStrictEqual([choice2]);
        });

        it('should exclude sources named even partially in notSources', () => {
            const baseSpecialization = AnimalCompanionSpecialization.from({
                skillChoices: [mockEmptySkillChoice.clone()],
            });

            const specializations = companion.class().specializations;

            specializations.set([
                new AnimalCompanionSpecialization(),
                baseSpecialization.clone().with({ name: 'A', level: 1 }),
                baseSpecialization.clone().with({ name: 'B', level: 2 }),
                baseSpecialization.clone().with({ name: 'C', level: 3 }),
                baseSpecialization.clone().with({ name: 'D', level: 4 }),
                baseSpecialization.clone().with({ name: 'E', level: 5 }),
            ]);

            // Change the source for the choice in every odd-numbered level
            specializations().forEach((level, index) =>
                level.skillChoices.forEach(choice => {
                    choice.source = (index % 2)
                        ? 'Feat: Skill Training'
                        : level.name;
                }),
            );

            // Only those choices without "Feat:" in the source should remain.
            const choice2 = specializations()[2]?.skillChoices[0];
            const choice4 = specializations()[4]?.skillChoices[0];

            const result = adapter.skillChoices$$({ maxLevelNumber: 5 }, { notSources: ['Feat:'] })();

            expect(result).toStrictEqual([choice2, choice4]);
        });
    });
});
