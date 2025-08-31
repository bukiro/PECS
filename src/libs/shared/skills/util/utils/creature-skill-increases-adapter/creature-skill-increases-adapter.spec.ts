import { Character } from 'src/libs/shared/character/util/models/character';
import { CharacterClassLevel } from 'src/libs/shared/character/util/models/character-class-level';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';
import { CharacterSkillChoicesAdapter } from '../creature-skill-choices-adapter/character-skill-choices-adapter';
import { mockSkillChoiceWithIncreases, mockSkillName, mockSkillType } from '../skill-testing-utils';
import { CreatureSkillIncreasesAdapter } from './creature-skill-increases-adapter';

describe('CreatureSkillIncreasesAdapter', () => {
    let recastFns: RecastFns;
    let character: Character;
    let adapter: CreatureSkillIncreasesAdapter;

    beforeEach(() => {
        recastFns = mockRecastFns();

        character = new Character(recastFns);

        const choicesAdapter = new CharacterSkillChoicesAdapter(character);

        adapter = new CreatureSkillIncreasesAdapter(choicesAdapter);

        // Prepare the character with five levels with one choice and increase each.
        const baseLevel = CharacterClassLevel.from({ skillChoices: [mockSkillChoiceWithIncreases] }, recastFns);

        const emptyLevel = new CharacterClassLevel();

        character.class().levels.set([
            emptyLevel,
            baseLevel.clone(recastFns),
            baseLevel.clone(recastFns),
            baseLevel.clone(recastFns),
            baseLevel.clone(recastFns),
            baseLevel.clone(recastFns),
        ]);
    });

    describe('skillIncreases$$', () => {
        it('should be limited to the level numbers', () => {
            expect(adapter.skillIncreases$$({ minLevelNumber: 2, maxLevelNumber: 3 })().length).toEqual(2);
        });

        it('should use the character level if not specified', () => {
            character.level.set(2);

            expect(adapter.skillIncreases$$({})().length).toEqual(2);
        });

        // eslint-disable-next-line complexity
        it('should match the filter', () => {
            const levels = character.class().levels();

            const choice1 = levels[1]?.skillChoices()[0];
            const choice2 = levels[2]?.skillChoices()[0];
            const choice3 = levels[3]?.skillChoices()[0];
            const choice4 = levels[4]?.skillChoices()[0];
            const choice5 = levels[5]?.skillChoices()[0];

            if (choice1) {
                choice1.type = mockSkillType;
                choice1.source = 'A';
                choice1.id = '1';

                const boost = choice1.increases()[0];

                if (boost) {
                    boost.name = mockSkillName;
                    boost.source = 'A';
                    boost.sourceId = '1';
                    boost.locked = true;
                }
            }

            if (choice2) {
                choice2.type = 'Skill';
                choice2.source = 'A';
                choice2.id = '1';

                const boost = choice2?.increases()[0];

                if (boost) {
                    boost.name = mockSkillName;
                    boost.source = 'A';
                    boost.sourceId = '1';
                    boost.locked = true;
                }
            }

            if (choice3) {
                choice3.type = 'Skill';
                choice3.source = 'B';
                choice3.id = '1';

                const boost = choice3.increases()[0];

                if (boost) {
                    boost.name = mockSkillName;
                    boost.source = 'B';
                    boost.sourceId = '1';
                    boost.locked = true;
                }
            }

            if (choice4) {
                choice4.type = 'Skill';
                choice4.source = 'B';
                choice4.id = '2';

                const boost = choice4.increases()[0];

                if (boost) {
                    boost.name = mockSkillName;
                    boost.source = 'B';
                    boost.sourceId = '2';
                    boost.locked = true;
                }
            }

            if (choice5) {
                choice5.type = mockSkillType;
                choice5.source = 'B';
                choice5.id = '2';

                const boost = choice5.increases()[0];

                if (boost) {
                    boost.name = mockSkillName;
                    boost.source = 'B';
                    boost.sourceId = '2';
                    boost.locked = true;
                }
            }

            expect(
                adapter.skillIncreases$$(
                    {
                        maxLevelNumber: 4,
                    },
                    {
                        name: mockSkillName,
                        type: 'Skill',
                        source: 'A',
                        sourceId: '1',
                        locked: true,
                    },
                )(),
            ).toEqual([choice2?.increases()[0]]);
        });

        it('should exclude sources named even partially in notSources', () => {
            const levels = character.class().levels();

            // Change the source for the choice in every odd-numbered level
            levels.forEach((level, index) =>
                level.skillChoices().forEach(choice => {
                    choice.source = (index % 2)
                        ? 'Feat: Skill Training'
                        : 'source';
                }),
            );

            // Only those choices without "Feat:" in the source should remain.
            const increase2 = levels[2]?.skillChoices()[0]?.increases()[0];
            const increase4 = levels[4]?.skillChoices()[0]?.increases()[0];

            const result = adapter.skillIncreases$$({ maxLevelNumber: 5 }, { notSources: ['Feat:'] })();

            expect(result).toStrictEqual([increase2, increase4]);
        });


        it('should exclude increases from showOnSheet choices with excludeTemporary', () => {
            const levels = character.class().levels();

            // Change the showOnSheet flag for the choice in every odd-numbered level
            levels.forEach((level, index) =>
                level.skillChoices().forEach(choice => {
                    choice.showOnSheet = !!(index % 2);
                }),
            );

            // Only those choices without "Feat:" in the source should remain.
            const increase2 = levels[2]?.skillChoices()[0]?.increases()[0];
            const increase4 = levels[4]?.skillChoices()[0]?.increases()[0];

            const result = adapter.skillIncreases$$({ maxLevelNumber: 5 }, {}, { excludeTemporary: true })();

            expect(result).toStrictEqual([increase2, increase4]);
        });

        it('should not count any skill increases for a skill that has no initial training, if the range starts at 0', () => {
            character.class().levels()
                .forEach(level => level.skillChoices().forEach(choice => { choice.minRank = 2; }));

            const result = adapter.skillIncreases$$({ minLevelNumber: 0 }, { name: mockSkillName })();

            expect(result).toStrictEqual([]);
        });
    });

    describe('allTrainedSkillNames$$', () => {
        it('should include all skills with any increases in the level range', () => {
            const levels = character.class().levels();

            levels.forEach((level, index) =>
                level.skillChoices().forEach(choice => {
                    choice.increases().forEach(increase => increase.name = `Skill ${ index }`);
                }),
            );

            const result = adapter.allTrainedSkillNames$$({ minLevelNumber: 1, maxLevelNumber: 3 })();

            expect(result).toStrictEqual([
                'Skill 1',
                'Skill 2',
                'Skill 3',
            ]);
        });

        // eslint-disable-next-line complexity
        it('should match the filter', () => {
            const levels = character.class().levels();

            const choice1 = levels[1]?.skillChoices()[0];
            const choice2 = levels[2]?.skillChoices()[0];
            const choice3 = levels[3]?.skillChoices()[0];
            const choice4 = levels[4]?.skillChoices()[0];
            const choice5 = levels[5]?.skillChoices()[0];

            if (choice1) {
                choice1.type = mockSkillType;
                choice1.source = 'A';
                choice1.id = '1';

                const boost = choice1.increases()[0];

                if (boost) {
                    boost.name = 'Skill 1';
                    boost.source = 'A';
                    boost.sourceId = '1';
                    boost.locked = true;
                }
            }

            if (choice2) {
                choice2.type = 'Skill';
                choice2.source = 'A';
                choice2.id = '1';

                const boost = choice2?.increases()[0];

                if (boost) {
                    boost.name = 'Skill 2';
                    boost.source = 'A';
                    boost.sourceId = '1';
                    boost.locked = true;
                }
            }

            if (choice3) {
                choice3.type = 'Skill';
                choice3.source = 'B';
                choice3.id = '1';

                const boost = choice3.increases()[0];

                if (boost) {
                    boost.name = 'Skill 3';
                    boost.source = 'B';
                    boost.sourceId = '1';
                    boost.locked = true;
                }
            }

            if (choice4) {
                choice4.type = 'Skill 4';
                choice4.source = 'B';
                choice4.id = '2';

                const boost = choice4.increases()[0];

                if (boost) {
                    boost.name = 'Skill';
                    boost.source = 'B';
                    boost.sourceId = '2';
                    boost.locked = true;
                }
            }

            if (choice5) {
                choice5.type = mockSkillType;
                choice5.source = 'B';
                choice5.id = '2';

                const boost = choice5.increases()[0];

                if (boost) {
                    boost.name = 'Skill 5';
                    boost.source = 'B';
                    boost.sourceId = '2';
                    boost.locked = true;
                }
            }

            expect(
                adapter.allTrainedSkillNames$$(
                    {
                        maxLevelNumber: 4,
                    },
                    {
                        type: 'Skill',
                        source: 'A',
                        sourceId: '1',
                        locked: true,
                    },
                )(),
            ).toEqual(['Skill 2']);
        });
    });
});
