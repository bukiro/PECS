import { Character } from 'src/libs/shared/character/util/models/character';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { CharacterAbilityChoicesAdapter } from './character-ability-choices-adapter';
import { CharacterClassLevel } from 'src/libs/shared/character/util/models/character-class-level';
import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';
import { mockEmptyAbilityChoice } from '../ability-testing-utils';

describe('CharacterAbilityChoicesAdapter', () => {
    let recastFns: RecastFns;
    let character: Character;
    let adapter: CharacterAbilityChoicesAdapter;

    beforeEach(() => {
        recastFns = mockRecastFns();
        character = new Character(recastFns);
        adapter = new CharacterAbilityChoicesAdapter(character);

        // Prepare the character with five levels with one choice each.
        const baseLevel = CharacterClassLevel.from({ abilityChoices: [mockEmptyAbilityChoice] }, recastFns);

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

    describe('abilityChoices$$', () => {
        it('should be limited to the level numbers', () => {
            expect(adapter.abilityChoices$$({ minLevelNumber: 2, maxLevelNumber: 3 })().length).toEqual(2);
        });

        it('should use the character level if not specified', () => {
            character.level.set(2);

            expect(adapter.abilityChoices$$({})().length).toEqual(2);
        });

        it('does not (currently) include ancestry or background choices', () => {
            character.class().ancestry().abilityChoices = [mockEmptyAbilityChoice.clone()];
            character.class().background().abilityChoices = [mockEmptyAbilityChoice.clone()];

            // Neither the ancestry nor the background boost are counted, so five levels return five choices.
            expect(adapter.abilityChoices$$({ maxLevelNumber: 5 })().length).not.toEqual(7);
        });

        it('should match the filter', () => {
            const levels = character.class().levels;

            const choice1 = levels()[1]?.abilityChoices()[0];
            const choice2 = levels()[2]?.abilityChoices()[0];
            const choice3 = levels()[3]?.abilityChoices()[0];
            const choice4 = levels()[4]?.abilityChoices()[0];
            const choice5 = levels()[5]?.abilityChoices()[0];

            if (choice1) {
                choice1.type = 'Boost';
                choice1.source = 'A';
                choice1.id = '1';
            }

            if (choice2) {
                choice2.type = 'Flaw';
                choice2.source = 'A';
                choice2.id = '1';
            }

            if (choice3) {
                choice3.type = 'Flaw';
                choice3.source = 'B';
                choice3.id = '1';
            }

            if (choice4) {
                choice4.type = 'Flaw';
                choice4.source = 'B';
                choice4.id = '2';
            }

            if (choice5) {
                choice5.type = 'Boost';
                choice5.source = 'B';
                choice5.id = '2';
            }

            expect(
                adapter.abilityChoices$$(
                    {
                        maxLevelNumber: 4,
                    },
                    {
                        type: 'Flaw',
                        source: 'A',
                        id: '1',
                    },
                )(),
            ).toStrictEqual([choice2]);
        });
    });
});
