import { FeatChoice } from './FeatChoice';
import { SkillChoice } from './SkillChoice';

export class Heritage {
    public name: string = "";
    public subTypes: Heritage[] = [];
    public subType: string = "";
    public increase: string = "";
    public actionChoices: string = "";
    public featChoices: FeatChoice[] = [];
    public skillChoices: SkillChoice[] = [];
    public vision: string = "";
    public traits: string[] = [];
    public ancestries: string[] = [];
    public desc: string = "";
}