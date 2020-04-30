import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';
import { AbilityChoice } from './AbilityChoice';
import { FeatChoice } from './FeatChoice';
import { SpellChoice } from './SpellChoice';
import { TraditionChoice } from './TraditionChoice';
import { AnimalCompanion } from './AnimalCompanion';

export class Level {
    public number: number = 0;
    public abilityChoices: AbilityChoice[] = [];
    public feats = [];
    public featChoices: FeatChoice[] = [];
    public skillChoices: SkillChoice[] = [];
    public loreChoices: LoreChoice[] = [];
    public spellChoices: SpellChoice[] = [];
    public animalCompanion: AnimalCompanion[] = [];
    public traditionChoices: TraditionChoice[] = [];
}