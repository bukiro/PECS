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
    //effects can be used to swim, climb or fly speeds as required
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
    reassign() {
        this.abilityChoices = this.abilityChoices.map(choice => Object.assign(new AbilityChoice(), choice));
        this.skillChoices = this.skillChoices.map(choice => Object.assign(new SkillChoice(), choice));
        this.activities = this.activities.map(gain => Object.assign(new ActivityGain(), gain));
        this.gainItems = this.gainItems.map(gain => Object.assign(new ItemGain(), gain));
    }
}