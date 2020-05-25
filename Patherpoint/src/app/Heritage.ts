import { FeatChoice } from './FeatChoice';
import { SkillChoice } from './SkillChoice';
import { ActivityGain } from './ActivityGain';
import { SpellChoice } from './SpellChoice';
import { ItemGain } from './ItemGain';

export class Heritage {
    public readonly _className: string = this.constructor.name;
    public gainActivities: string[] = [];
    public ancestries: string[] = [];
    public desc: string = "";
    public featChoices: FeatChoice[] = [];
    public gainItems: ItemGain[] = [];
    public increase: string = "";
    public name: string = "";
    public senses: string[] = [];
    public skillChoices: SkillChoice[] = [];
    public spellChoices: SpellChoice[] = [];
    public subType: string = "";
    public subTypes: Heritage[] = [];
    public traits: string[] = [];
}