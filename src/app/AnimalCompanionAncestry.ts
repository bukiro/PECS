import { ItemGain } from './ItemGain';
import { AbilityChoice } from './AbilityChoice';
import { SkillChoice } from './SkillChoice';
import { ActivityGain } from './ActivityGain';
import { EffectGain } from './EffectGain';
import { Hint } from './Hint';

export class AnimalCompanionAncestry {
        public abilityChoices: AbilityChoice[] = [];
    public activities: ActivityGain[] = [];
    public desc: string = "";
    public gainItems: ItemGain[] = [];
    public hitPoints: number = 0;
    public name: string = "";
    public senses: string[] = [];
    public hints: Hint[] = [];
    public size: number = 0;
    public skillChoices: SkillChoice[] = [];
    public specialdesc: string = "";
    public speeds: { name: string, value: number }[] = [];
    public supportBenefit: string = "";
    public traits: string[] = [];
    recast() {
        this.abilityChoices = this.abilityChoices.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.activities = this.activities.map(obj => Object.assign(new ActivityGain(), obj).recast());
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.skillChoices = this.skillChoices.map(obj => Object.assign(new SkillChoice(), obj).recast());
        return this;
    }
}