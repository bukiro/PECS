import { SkillChoice } from 'src/app/classes/SkillChoice';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { FeatChoice } from 'src/libs/shared/definitions/models/FeatChoice';

export class ClassLevel {
    public abilityChoices: Array<AbilityChoice> = [];
    public featChoices: Array<FeatChoice> = [];
    public loreChoices: Array<LoreChoice> = [];
    public number = 0;
    public skillChoices: Array<SkillChoice> = [];

    public recast(): ClassLevel {
        this.abilityChoices = this.abilityChoices.map(obj => Object.assign(new AbilityChoice(), obj).recast());
        this.featChoices = this.featChoices.map(obj => Object.assign(new FeatChoice(), obj).recast());
        this.loreChoices = this.loreChoices.map(obj => Object.assign(new LoreChoice(), obj).recast());
        this.skillChoices = this.skillChoices.map(obj => Object.assign(new SkillChoice(), obj).recast());

        return this;
    }

    public addAbilityChoice(newChoice: AbilityChoice): AbilityChoice {
        const existingChoices = this.abilityChoices.filter(choice => choice.source === newChoice.source);
        const tempChoice = newChoice.clone();

        tempChoice.id = `${ this.number }-Ability-${ tempChoice.source }-${ existingChoices.length }`;

        const newLength = this.abilityChoices.push(tempChoice);

        return this.abilityChoices[newLength - 1];
    }

    public removeAbilityChoice(oldChoice: AbilityChoice): void {
        this.abilityChoices.splice(this.abilityChoices.indexOf(oldChoice), 1);
    }

    /**
     * Remove the first ability choice that matches the source name.
     */
    public removeAbilityChoiceBySource(source: string): void {
        const foundChoice = this.abilityChoices.find(choice => choice.source === source);

        if (foundChoice) {
            this.removeAbilityChoice(foundChoice);
        }
    }

    public addSkillChoice(newChoice: SkillChoice): SkillChoice {
        const existingChoices = this.skillChoices.filter(choice => choice.source === newChoice.source);
        const tempChoice = newChoice.clone();

        tempChoice.id = `${ this.number }-Skill-${ tempChoice.source }-${ existingChoices.length }`;

        const newLength: number = this.skillChoices.push(tempChoice);

        return this.skillChoices[newLength - 1];
    }

    public removeSkillChoice(oldChoice: SkillChoice): void {
        this.skillChoices.splice(this.skillChoices.indexOf(oldChoice), 1);
    }

    /**
     * Remove the first skill choice that matches the source name.
     */
    public removeSkillChoiceBySource(source: string): void {
        const foundChoice = this.skillChoices.find(choice => choice.source === source);

        if (foundChoice) {
            this.removeSkillChoice(foundChoice);
        }
    }

    public addLoreChoice(newChoice: LoreChoice): LoreChoice {
        const existingChoices = this.loreChoices.filter(choice => choice.source === newChoice.source);
        const tempChoice = newChoice.clone();

        tempChoice.id = `${ this.number }-Lore-${ tempChoice.source }-${ existingChoices.length }`;

        const newLength: number = this.loreChoices.push(tempChoice);

        return this.loreChoices[newLength - 1];
    }

    public removeLoreChoice(oldChoice: LoreChoice): void {
        this.loreChoices.splice(this.loreChoices.indexOf(oldChoice), 1);
    }

    public addFeatChoice(newChoice: FeatChoice): FeatChoice {
        const existingChoices = this.featChoices.filter(choice => choice.source === newChoice.source);
        const tempChoice = newChoice.clone();

        tempChoice.id =
            `${ this.number }-${ tempChoice.type ? tempChoice.type : 'Feat' }-${ tempChoice.source }-${ existingChoices.length }`;

        const newLength: number = this.featChoices.push(tempChoice);

        this.featChoices[newLength - 1].feats.forEach(feat => {
            feat.source = this.featChoices[newLength - 1].source;
            feat.sourceId = this.featChoices[newLength - 1].id;
        });

        return this.featChoices[newLength - 1];
    }

    public removeFeatChoice(oldChoice: FeatChoice): void {
        this.featChoices.splice(this.featChoices.indexOf(oldChoice), 1);
    }
}
