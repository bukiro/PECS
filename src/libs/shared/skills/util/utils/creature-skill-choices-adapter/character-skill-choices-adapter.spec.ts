import { Character } from 'src/libs/shared/character/util/models/character';
import { CharacterClassLevel } from 'src/libs/shared/character/util/models/character-class-level';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';
import { mockEmptySkillChoice, mockSkillType } from '../skill-testing-utils';
import { CharacterSkillChoicesAdapter } from './character-skill-choices-adapter';
import { Weapon } from 'src/libs/shared/items/util/models/weapon';
import { WeaponRune } from 'src/libs/shared/items/util/models/weapon-rune';
import { LoreChoice } from 'src/libs/shared/lores/util/models/lore-choice';

describe('CharacterSkillChoicesAdapter', () => {
    let recastFns: RecastFns;
    let character: Character;
    let adapter: CharacterSkillChoicesAdapter;

    beforeEach(() => {
        recastFns = mockRecastFns();
        character = new Character(recastFns);
        adapter = new CharacterSkillChoicesAdapter(character);

        // Prepare the character with five levels with one choice each.
        const baseLevel = CharacterClassLevel.from({ skillChoices: [mockEmptySkillChoice] }, recastFns);

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

    describe('skillChoices$$', () => {
        it('should be limited to the level numbers', () => {
            expect(adapter.skillChoices$$({ minLevelNumber: 2, maxLevelNumber: 3 })().length).toEqual(2);
        });

        it('should use the character level if not specified', () => {
            character.level.set(2);

            expect(adapter.skillChoices$$({})().length).toEqual(2);
        });

        it('should include lore choices from active items without excludeTemporary', () => {
            const choice = new LoreChoice();
            const rune = new WeaponRune();
            const weapon = Weapon.from({ equippable: true, equipped: true }, recastFns);

            rune.loreChoices = [choice];
            weapon.propertyRunes.set([rune]);

            character.inventories()[0]?.weapons.set([weapon]);

            expect(
                adapter.skillChoices$$({ minLevelNumber: 1, maxLevelNumber: 1 })(),
            ).toStrictEqual(expect.arrayContaining([choice]));
        });

        it('does not (currently) include ancestry or background choices', () => {
            character.class().background().skillChoices = [mockEmptySkillChoice.clone()];

            // Neither the ancestry nor the background boost are counted, so five levels return five choices.
            expect(adapter.skillChoices$$({ maxLevelNumber: 5 })().length).not.toEqual(7);
        });

        it('should match the filter', () => {
            const levels = character.class().levels;

            const choice1 = levels()[1]?.skillChoices()[0];
            const choice2 = levels()[2]?.skillChoices()[0];
            const choice3 = levels()[3]?.skillChoices()[0];
            const choice4 = levels()[4]?.skillChoices()[0];
            const choice5 = levels()[5]?.skillChoices()[0];

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
                        maxLevelNumber: 4,
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
            const choice2 = levels[2]?.skillChoices()[0];
            const choice4 = levels[4]?.skillChoices()[0];

            const result = adapter.skillChoices$$({ maxLevelNumber: 5 }, { notSources: ['Feat:'] })();

            expect(result).toStrictEqual([choice2, choice4]);
        });
    });
});
