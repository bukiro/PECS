import { Character } from 'src/libs/shared/character/util/models/character';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { CharacterClassLevel } from 'src/libs/shared/character/util/models/character-class-level';
import { CreatureAbilityBoostsAdapter } from './creature-ability-boosts-adapter';
import { mockRecastFns } from 'src/libs/shared/serialization/util/utils/serialization-testing-utils';
import { CharacterAbilityChoicesAdapter } from '../creature-ability-choices-adapter/character-ability-choices-adapter';
import { mockAbilityChoiceWithBoost, mockAbilityName } from '../ability-testing-utils';

describe('CreatureAbilityBoostsAdapter', () => {
    let recastFns: RecastFns;
    let character: Character;
    let adapter: CreatureAbilityBoostsAdapter;

    beforeEach(() => {
        recastFns = mockRecastFns();
        character = new Character(recastFns);

        // Prepare the character with five levels with one choice and boost each.
        const baseLevel = CharacterClassLevel.from({ abilityChoices: [mockAbilityChoiceWithBoost] }, recastFns);

        const emptyLevel = new CharacterClassLevel();

        character.class().levels.set([
            emptyLevel,
            baseLevel.clone(recastFns),
            baseLevel.clone(recastFns),
            baseLevel.clone(recastFns),
            baseLevel.clone(recastFns),
            baseLevel.clone(recastFns),
        ]);

        const abilityChoicesAdapter = new CharacterAbilityChoicesAdapter(character);

        adapter = new CreatureAbilityBoostsAdapter(abilityChoicesAdapter);
    });

    describe('abilityBoosts$$', () => {
        it('should be limited to the level numbers', () => {
            expect(adapter.abilityBoosts$$({ minLevelNumber: 2, maxLevelNumber: 3 })().length).toEqual(2);
        });

        it('should use the character level if not specified', () => {
            character.level.set(2);

            expect(adapter.abilityBoosts$$({})().length).toEqual(2);
        });

        // eslint-disable-next-line complexity
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

                const boost = choice1.boosts()[0];

                if (boost) {
                    boost.name = mockAbilityName;
                    boost.type = 'Boost';
                    boost.source = 'A';
                    boost.sourceId = '1';
                    boost.locked = true;
                }
            }

            if (choice2) {
                choice2.type = 'Flaw';
                choice2.source = 'A';
                choice2.id = '1';

                const boost = choice2?.boosts()[0];

                if (boost) {
                    boost.name = mockAbilityName;
                    boost.type = 'Flaw';
                    boost.source = 'A';
                    boost.sourceId = '1';
                    boost.locked = true;
                }
            }

            if (choice3) {
                choice3.type = 'Flaw';
                choice3.source = 'B';
                choice3.id = '1';

                const boost = choice3.boosts()[0];

                if (boost) {
                    boost.name = mockAbilityName;
                    boost.type = 'Flaw';
                    boost.source = 'B';
                    boost.sourceId = '1';
                    boost.locked = true;
                }
            }

            if (choice4) {
                choice4.type = 'Flaw';
                choice4.source = 'B';
                choice4.id = '2';

                const boost = choice4.boosts()[0];

                if (boost) {
                    boost.name = mockAbilityName;
                    boost.type = 'Flaw';
                    boost.source = 'B';
                    boost.sourceId = '2';
                    boost.locked = true;
                }
            }

            if (choice5) {
                choice5.type = 'Boost';
                choice5.source = 'B';
                choice5.id = '2';

                const boost = choice5.boosts()[0];

                if (boost) {
                    boost.name = mockAbilityName;
                    boost.type = 'Boost';
                    boost.source = 'B';
                    boost.sourceId = '2';
                    boost.locked = true;
                }
            }

            expect(
                adapter.abilityBoosts$$(
                    {
                        maxLevelNumber: 4,
                    },
                    {
                        abilityName: mockAbilityName,
                        type: 'Flaw',
                        source: 'A',
                        sourceId: '1',
                        locked: true,
                    },
                )(),
            ).toEqual([choice2?.boosts()[0]]);
        });
    });
});
