import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { AbilityChoice } from '../../character-creation/ability-choice';
import { LoreChoice } from '../../character-creation/lore-choice';
import { SkillChoice } from '../../character-creation/skill-choice';
import { FeatChoice } from 'src/libs/shared/definitions/models/feat-choice';
import { signal } from '@angular/core';

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

    public readonly abilityChoices = signal<Array<AbilityChoice>>([]);
    public readonly featChoices = signal<Array<FeatChoice>>([]);
    public readonly loreChoices = signal<Array<LoreChoice>>([]);
    public readonly skillChoices = signal<Array<SkillChoice>>([]);

    public static from(values: MaybeSerialized<CharacterClassLevel>): CharacterClassLevel {
        return new CharacterClassLevel().with(values);
    }

    public with(values: MaybeSerialized<CharacterClassLevel>): CharacterClassLevel {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<CharacterClassLevel> {
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
        const existingChoices = this.abilityChoices().filter(choice => choice.source === newChoice.source);
        const addedChoice = newChoice.clone().with({
            id: `${ this.number }-Ability-${ newChoice.source }-${ existingChoices.length }`,
        });

        this.abilityChoices.update(value => [...value, addedChoice]);

        return addedChoice;
    }

    public removeAbilityChoice(oldChoice: AbilityChoice): void {
        this.abilityChoices.update(value => value.filter(choice => choice !== oldChoice));
    }

    /**
     * Remove the first ability choice that matches the source name.
     */
    public removeAbilityChoiceBySource(source: string): void {
        const foundChoice = this.abilityChoices().find(choice => choice.source === source);

        if (foundChoice) {
            this.removeAbilityChoice(foundChoice);
        }
    }

    public addSkillChoice(newChoice: SkillChoice): SkillChoice {
        const existingChoices = this.skillChoices().filter(choice => choice.source === newChoice.source);
        const addedChoice = newChoice.clone().with({ id: `${ this.number }-Skill-${ newChoice.source }-${ existingChoices.length }` });

        this.skillChoices.update(value => [...value, addedChoice]);

        return addedChoice;
    }

    public removeSkillChoice(oldChoice: SkillChoice): void {
        this.skillChoices.update(value => value.filter(choice => choice !== oldChoice));
    }

    /**
     * Remove the first skill choice that matches the source name.
     */
    public removeSkillChoiceBySource(source: string): void {
        const foundChoice = this.skillChoices().find(choice => choice.source === source);

        if (foundChoice) {
            this.removeSkillChoice(foundChoice);
        }
    }

    public addLoreChoice(newChoice: LoreChoice): LoreChoice {
        const existingChoices = this.loreChoices().filter(choice => choice.source === newChoice.source);
        const addedChoice = newChoice.clone().with({ id: `${ this.number }-Lore-${ newChoice.source }-${ existingChoices.length }` });

        this.loreChoices.update(value => [...value, addedChoice]);

        return addedChoice;
    }

    public removeLoreChoice(oldChoice: LoreChoice): void {
        this.loreChoices.update(value => value.filter(choice => choice !== oldChoice));
    }

    public addFeatChoice(newChoice: FeatChoice): FeatChoice {
        const existingChoices = this.featChoices().filter(choice => choice.source === newChoice.source);
        const addedChoice = newChoice.clone().with({
            id: `${ this.number }-${ newChoice.type ? newChoice.type : 'Feat' }-${ newChoice.source }-${ existingChoices.length }`,
        });

        addedChoice.feats().forEach(feat => {
            feat.source = addedChoice.source;
            feat.sourceId = addedChoice.id;
        });

        this.featChoices.update(value => [...value, addedChoice]);

        return addedChoice;
    }

    public removeFeatChoice(oldChoice: FeatChoice): void {
        this.featChoices.update(value => value.filter(choice => choice !== oldChoice));
    }
}
