import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';
import { AbilityChoice } from './AbilityChoice';
import { FeatChoice } from './FeatChoice';

export class Level {
    constructor (
        public number: number = 0,
        public abilityChoices: AbilityChoice[] = [],
        public feats = [],
        public featChoices: FeatChoice[] = [],
        public skillChoices: SkillChoice[] = [],
        public loreChoices: LoreChoice[] = [],
    ) { }
}