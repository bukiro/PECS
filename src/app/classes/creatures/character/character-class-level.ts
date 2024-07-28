import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { AbilityChoice } from '../../character-creation/ability-choice';
import { LoreChoice } from '../../character-creation/lore-choice';
import { SkillChoice } from '../../character-creation/skill-choice';
import { FeatChoice } from 'src/libs/shared/definitions/models/feat-choice';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';

const { assign, forExport, isEqual } = setupSerialization<CharacterClassLevel>({
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

export class CharacterClassLevel implements Serializable<CharacterClassLevel> {
    public number = 0;

    public abilityChoices: Array<AbilityChoice> = [];
    public featChoices: Array<FeatChoice> = [];
    public loreChoices: Array<LoreChoice> = [];
    public skillChoices: Array<SkillChoice> = [];

    public static from(values: DeepPartial<CharacterClassLevel>): CharacterClassLevel {
        return new CharacterClassLevel().with(values);
    }

    public with(values: DeepPartial<CharacterClassLevel>): CharacterClassLevel {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<CharacterClassLevel> {
        return {
            ...forExport(this),
        };
    }

    public clone(): CharacterClassLevel {
        return CharacterClassLevel.from(this);
    }

    public isEqual(compared: Partial<CharacterClassLevel>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public addAbilityChoice(newChoice: AbilityChoice): AbilityChoice {
        const existingChoices = this.abilityChoices.filter(choice => choice.source === newChoice.source);
        const addedChoice = newChoice.clone().with({
            id: `${ this.number }-Ability-${ newChoice.source }-${ existingChoices.length }`,
        });

        this.abilityChoices.push(addedChoice);

        return addedChoice;
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
        const addedChoice = newChoice.clone().with({ id: `${ this.number }-Skill-${ newChoice.source }-${ existingChoices.length }` });

        this.skillChoices.push(addedChoice);

        return addedChoice;
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
        const addedChoice = newChoice.clone().with({ id: `${ this.number }-Lore-${ newChoice.source }-${ existingChoices.length }` });

        this.loreChoices.push(addedChoice);

        return addedChoice;
    }

    public removeLoreChoice(oldChoice: LoreChoice): void {
        this.loreChoices.splice(this.loreChoices.indexOf(oldChoice), 1);
    }

    public addFeatChoice(newChoice: FeatChoice): FeatChoice {
        const existingChoices = this.featChoices.filter(choice => choice.source === newChoice.source);
        const addedChoice = newChoice.clone().with({
            id: `${ this.number }-${ newChoice.type ? newChoice.type : 'Feat' }-${ newChoice.source }-${ existingChoices.length }`,
        });

        addedChoice.feats.forEach(feat => {
            feat.source = addedChoice.source;
            feat.sourceId = addedChoice.id;
        });

        this.featChoices.push(addedChoice);

        return addedChoice;
    }

    public removeFeatChoice(oldChoice: FeatChoice): void {
        this.featChoices.splice(this.featChoices.indexOf(oldChoice), 1);
    }
}
