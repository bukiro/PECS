import { SkillIncrease } from './SkillIncrease';
import { LoreIncrease } from './LoreIncrease';
import { AbilityBoost } from './AbilityBoost';

export class Level {
    constructor (
        public number: number = 0,
        public abilityBoosts = [],
        public availableAbilityBoosts: AbilityBoost[] = [],
        public feats = [],
        public ancestryFeats_available: number = 0,
        public ancestryFeats_applied: number = 0,
        public classFeats_available: number = 0,
        public classFeats_applied: number = 0,
        public skillFeats_available: number = 0,
        public skillFeats_applied: number = 0,
        public generalFeats_available: number = 0,
        public generalFeats_applied: number = 0,
        public skillIncreases = [],
        public availableSkillIncreases: SkillIncrease[] = [],
        public availableLoreIncreases: LoreIncrease[] = [],
        public featAncestryFeats_available: number = 0,
        public featAncestryFeats_applied: number = 0,
        public featClassFeats_available: number = 0,
        public featClassFeats_applied: number = 0,
        public featSkillFeats_available: number = 0,
        public featSkillFeats_applied: number = 0,
    ) { }
}