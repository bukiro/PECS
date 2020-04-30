import { ItemGain } from './ItemGain';
import { AbilityChoice } from './AbilityChoice';
import { SkillChoice } from './SkillChoice';
import { ActivityGain } from './ActivityGain';

export class AnimalCompanionAncestry {
    public name: string = "";
    public desc: string = "";
    public specialdesc: string = "";
    public hitPoints: number = 0;
    public size: number = 0;
    public speed: number = 0;
    public senses: string[] = [];
    public abilityChoices: AbilityChoice[] = [];
    public skillChoices: SkillChoice[] = [];
    public activities: ActivityGain[] = [];
    public gainItems: ItemGain[] = [];
    public supportBenefit: string = "";
    public traits: string[] = [];
    reassign() {
        this.abilityChoices = this.abilityChoices.map(choice => Object.assign(new AbilityChoice(), choice));
        this.skillChoices = this.skillChoices.map(choice => Object.assign(new SkillChoice(), choice));
        this.activities = this.activities.map(gain => Object.assign(new ActivityGain(), gain));
        this.gainItems = this.gainItems.map(gain => Object.assign(new ItemGain(), gain));
    }
}