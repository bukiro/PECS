import { AbilityBoost } from '../models/ability-boost';
import { AbilityChoice } from '../models/ability-choice';

export const mockAbilityName = 'AbilityName';

export const mockAbilityBoost: AbilityBoost = {
    type: 'Boost',
    name: mockAbilityName,
    source: 'source',
    sourceId: 'sourceId',
    locked: false,
};

export const mockAbilityChoiceWithBoost: AbilityChoice = AbilityChoice.from({
    available: 1,
    type: 'Boost',
    source: 'source',
    id: 'sourceId',
    boosts: [
        { ...mockAbilityBoost },
    ],
});

export const mockEmptyAbilityChoice: AbilityChoice = AbilityChoice.from({
    available: 1,
    type: 'Boost',
    source: 'source',
    id: 'sourceId',
});
