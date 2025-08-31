import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { signal } from '@angular/core';
import { FeatChoice } from 'src/libs/shared/feats/util/models/feat-choice';
import { LoreChoice } from 'src/libs/shared/lores/util/models/lore-choice';
import { SkillChoice } from 'src/libs/shared/skills/util/models/skill-choice';
import { AbilityChoice } from 'src/libs/shared/abilities/util/models/ability-choice';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<CharacterClassLevel>({
    primitives: [
        'number',
    ],
    serializableArrays: {
        abilityChoices:
            () => obj => AbilityChoice.from(obj),
        featChoices:
            recastFns => obj => FeatChoice.from(obj, recastFns),
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

    public static from(values: MaybeSerialized<CharacterClassLevel>, recastFns: RecastFns): CharacterClassLevel {
        return new CharacterClassLevel().with(values, recastFns);
    }

    public with(values: MaybeSerialized<CharacterClassLevel>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<CharacterClassLevel> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return CharacterClassLevel.from(this, recastFns) as this;
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
        const addedChoice = newChoice.clone(RecastService.recastFns).with({
            id: `${ this.number }-${ newChoice.type ? newChoice.type : 'Feat' }-${ newChoice.source }-${ existingChoices.length }`,
        }, RecastService.recastFns);

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
