import { ItemGain } from 'src/app/classes/ItemGain';
import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Hint } from 'src/app/classes/Hint';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';

export class AnimalCompanionAncestry {
    public abilityChoices: Array<AbilityChoice> = [];
    public activities: Array<ActivityGain> = [];
    public desc = '';
    public gainItems: Array<ItemGain> = [];
    public hitPoints = 0;
    public name = '';
    public senses: Array<string> = [];
    public hints: Array<Hint> = [];
    public size = 0;
    public skillChoices: Array<SkillChoice> = [];
    public sourceBook = '';
    public specialdesc = '';
    public speeds: Array<{ name: string; value: number }> = [];
    public supportBenefit = '';
    public traits: Array<string> = [];

    public recast(recastFns: RecastFns): this {
        this.abilityChoices = this.abilityChoices.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.activities = this.activities.map(obj => recastFns.activityGain(obj).recast(recastFns));
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.hints = this.hints.map(obj => Object.assign(new Hint(), obj).recast());
        this.skillChoices = this.skillChoices.map(obj => Object.assign(new SkillChoice(), obj).recast());

        return this;
    }

    public clone(recastFns: RecastFns): AnimalCompanionAncestry {
        return Object.assign<AnimalCompanionAncestry, AnimalCompanionAncestry>(
            new AnimalCompanionAncestry(), JSON.parse(JSON.stringify(this)),
        ).recast(recastFns);
    }
}
