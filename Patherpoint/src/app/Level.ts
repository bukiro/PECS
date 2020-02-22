import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';
import { AbilityChoice } from './AbilityChoice';

export class Level {
    constructor (
        public number: number = 0,
        public abilityChoices: AbilityChoice[] = [],
        public feats = [],
        public ancestryFeats_available: number = 0,
        public ancestryFeats_applied: number = 0,
        public classFeats_available: number = 0,
        public classFeats_applied: number = 0,
        public skillFeats_available: number = 0,
        public skillFeats_applied: number = 0,
        public generalFeats_available: number = 0,
        public generalFeats_applied: number = 0,
        public skillChoices: SkillChoice[] = [],
        public loreChoices: LoreChoice[] = [],
        public featAncestryFeats_available: number = 0,
        public featAncestryFeats_applied: number = 0,
        public featClassFeats_available: number = 0,
        public featClassFeats_applied: number = 0,
        public featSkillFeats_available: number = 0,
        public featSkillFeats_applied: number = 0,
    ) { }
}