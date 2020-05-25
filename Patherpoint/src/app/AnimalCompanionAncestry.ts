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
    //effects can be used to add swim, climb or fly speeds as required
    //Is this actually used?
    public effects: EffectGain[] = [];
    public gainItems: ItemGain[] = [];
    public hint: string = "";
    public hitPoints: number = 0;
    public name: string = "";
    public senses: string[] = [];
    public showon: string = "";
    public size: number = 0;
    public skillChoices: SkillChoice[] = [];
    public specialdesc: string = "";
    public speed: number = 0;
    public supportBenefit: string = "";
    public traits: string[] = [];
}