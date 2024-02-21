import { SkillChoice } from 'src/app/classes/SkillChoice';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { FeatChoice } from 'src/libs/shared/definitions/models/FeatChoice';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport } = setupSerialization<ClassLevel>({
    primitives: [
        'number',
    ],
    serializableArrays: {
        abilityChoices:
            () => obj => AbilityChoice.from(obj),
        featChoices:
            () => obj => FeatChoice.from(obj),
        loreChoices:
            () => obj => LoreChoice.from(obj),
        skillChoices:
            () => obj => SkillChoice.from(obj),
    },
});

export class ClassLevel implements Serializable<ClassLevel> {
    public number = 0;

    public abilityChoices: Array<AbilityChoice> = [];
    public featChoices: Array<FeatChoice> = [];
    public loreChoices: Array<LoreChoice> = [];
    public skillChoices: Array<SkillChoice> = [];

    public static from(values: DeepPartial<ClassLevel>): ClassLevel {
        return new ClassLevel().with(values);
    }

    public with(values: DeepPartial<ClassLevel>): ClassLevel {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<ClassLevel> {
        return {
            ...forExport(this),
        };
    }

    public clone(): ClassLevel {
        return ClassLevel.from(this);
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
