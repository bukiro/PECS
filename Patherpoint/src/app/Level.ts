import { SkillChoice } from './SkillChoice';
import { LoreChoice } from './LoreChoice';
import { AbilityChoice } from './AbilityChoice';
import { FeatChoice } from './FeatChoice';
import { SpellChoice } from './SpellChoice';
import { TraditionChoice } from './TraditionChoice';

export class Level {
    public readonly _className: string = this.constructor.name;
    public abilityChoices: AbilityChoice[] = [];
    public featChoices: FeatChoice[] = [];
    public loreChoices: LoreChoice[] = [];
    public number: number = 0;
    public skillChoices: SkillChoice[] = [];
    public spellChoices: SpellChoice[] = [];
    public traditionChoices: TraditionChoice[] = [];
}