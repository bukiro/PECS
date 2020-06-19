import { ItemGain } from './ItemGain';
import { AbilityChoice } from './AbilityChoice';
import { SkillChoice } from './SkillChoice';
import { ActivityGain } from './ActivityGain';
import { EffectGain } from './EffectGain';

export class AnimalCompanionAncestry {
    public readonly _className: string = this.constructor.name;
    public abilityChoices: AbilityChoice[] = [];
    public activities: ActivityGain[] = [];
    public desc: string = "";
    public gainItems: ItemGain[] = [];
    public hint: string = "";
    public hitPoints: number = 0;
    public name: string = "";
    public senses: string[] = [];
    public showon: string = "";
    public size: number = 0;
    public skillChoices: SkillChoice[] = [];
    public specialdesc: string = "";
    public speeds: {name:string, value:number}[] = [];
    public supportBenefit: string = "";
    public traits: string[] = [];
}