import { AbilityBoost } from 'src/libs/shared/definitions/creature-properties/ability-boost';
import { CreatureTypeIds } from 'src/libs/shared/definitions/creature-type-ids';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { Skill } from '../../skills/skill';
import { SkillIncrease } from '../../skills/skill-increase';
import { Creature } from '../creature';
import { AnimalCompanionAncestry } from './animal-companion-ancestry';
import { AnimalCompanionClass } from './animal-companion-class';
import { AnimalCompanionLevel } from './animal-companion-level';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { computed, Signal, signal } from '@angular/core';
import { matchBooleanFilter, matchStringFilter } from 'src/libs/shared/util/filter-utils';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<AnimalCompanion>({
    primitives: [
        'species',
    ],
    serializables: {
        class:
            recastFns => obj => AnimalCompanionClass.from(obj, recastFns),
    },
});

export class AnimalCompanion extends Creature implements Serializable<AnimalCompanion> {
    public readonly type: CreatureTypes = CreatureTypes.AnimalCompanion;
    public readonly typeId: CreatureTypeIds = CreatureTypeIds.AnimalCompanion;

    public readonly class = signal(new AnimalCompanionClass());
    public readonly species = signal('');

    public readonly customSkills = signal<Array<Skill>>([
        new Skill('', 'Light Barding', 'Armor Proficiency'),
        new Skill('', 'Heavy Barding', 'Armor Proficiency'),
    ]);

    public baseSize$$ = computed(() => {
        const ancestry = this.class().ancestry();
        const levels = this.class().levels();
        const currentLevel = this.level();

        return levels
            .filter(level => level.number <= currentLevel)
            .reduce(
                (size, level) => {
                    if (level.sizeChange) {
                        return Math.min(size + level.sizeChange, 1);
                    }

                    return size;
                },
                ancestry.size ?? 0,
            );
    });

    public get requiresConForHP(): boolean { return true; }

    public static from(values: MaybeSerialized<AnimalCompanion>, recastFns: RecastFns): AnimalCompanion {
        return new AnimalCompanion().with(values, recastFns);
    }

    public with(values: MaybeSerialized<AnimalCompanion>, recastFns: RecastFns): AnimalCompanion {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<AnimalCompanion> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): AnimalCompanion {
        return AnimalCompanion.from(this, recastFns);
    }

    public isEqual(compared: Partial<AnimalCompanion>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isAnimalCompanion(): this is AnimalCompanion {
        return true;
    }

    public canEquipItems(): this is AnimalCompanion {
        return true;
    }

    public baseHP$$(charLevel: number, conModifier: number): Signal<{ result: number; bonuses: Array<BonusDescription> }> {
        return computed(() => {
            const currentClass = this.class();
            const ancestry = currentClass.ancestry();

            const bonuses = new Array<BonusDescription>();
            let result = 0;

            if (currentClass.hitPoints) {
                if (ancestry.name) {
                    result += ancestry.hitPoints;
                    bonuses.push({ title: 'Ancestry base HP', value: String(ancestry.hitPoints) });
                }

                result += (currentClass.hitPoints + conModifier) * charLevel;
                bonuses.push(
                    {
                        title: 'Class base HP',
                        subline: '(multiplied with level)',
                        value: `${ currentClass.hitPoints } (${ currentClass.hitPoints * charLevel })`,
                    },
                    {
                        title: 'Constitution modifier',
                        subline: '(multiplied with level)',
                        value: `${ conModifier } (${ conModifier * charLevel })`,
                    },
                );
            }

            return { result, bonuses };
        });
    }

    public baseSpeed$$(speedName: string): Signal<{ result: number; explain: string }> {
        return computed(() => {
            const currentClass = this.class();
            const ancestry = currentClass.ancestry();

            if (ancestry.name) {
                return ancestry.speeds
                    .filter(speed => speed.name === speedName)
                    .reduce(
                        (_, speed) => ({
                            result: speed.value,
                            explain: `${ ancestry.name } base speed: ${ speed.value }`,
                        }),
                        { result: 0, explain: '' },
                    );
            }

            return { result: 0, explain: '' };
        });
    }

    public abilityBoosts$$(
        minLevelNumber: number,
        maxLevelNumber: number,
        abilityName = '',
        type = '',
        source = '',
        sourceId = '',
        locked: boolean | undefined = undefined,
    ): Signal<Array<AbilityBoost>> {
        return computed(() => {
            const flatRecursion = 2;

            const currentClass = this.class();
            const companionLevel = this.level();

            // When animal companion levels are checked for ability boosts,
            // we don't care about the character level, but always use the animal companion's level.
            const levels = new Array<AnimalCompanionLevel | AnimalCompanionAncestry>(
                currentClass.ancestry(),
                ...currentClass.levels().filter(level => level.number >= 0 && level.number <= companionLevel),
            );

            // When specializations are checked for ability boosts,
            // we want to be certain we don't get a specialization that is taken on a higher character level
            const specializations =
                currentClass.specializations().filter(spec => spec.level >= minLevelNumber && spec.level <= maxLevelNumber);

            return new Array<AbilityBoost>(
                ...levels.map(level =>
                    level.abilityChoices.map(choice =>
                        choice.boosts.filter(boost =>
                            matchStringFilter({ value: boost.name, match: abilityName })
                            && matchStringFilter({ value: boost.type, match: type })
                            && matchStringFilter({ value: boost.source, match: source })
                            && matchStringFilter({ value: boost.sourceId, match: sourceId })
                            && matchBooleanFilter({ value: boost.locked, match: locked }),
                        ),
                    ),
                ).flat(flatRecursion),
                ...specializations.map((spec, index) =>
                    spec.abilityChoices
                        // Every animal companion specialization adds extra ability boosts if it is the first specialization.
                        // Only the first specialization may add these "First specialization" boosts.
                        .filter(choice => (choice.source !== 'First specialization' || index === 0))
                        .map(choice =>
                            choice.boosts.filter(boost =>
                                matchStringFilter({ value: boost.name, match: abilityName })
                                && matchStringFilter({ value: boost.type, match: type })
                                && matchStringFilter({ value: boost.source, match: source })
                                && matchStringFilter({ value: boost.sourceId, match: sourceId })
                                && matchBooleanFilter({ value: boost.locked, match: locked }),
                            ),
                        ),
                ).flat(flatRecursion),
            );
        });
    }

    public skillIncreases$$(
        minLevelNumber: number,
        maxLevelNumber: number,
        skillName = '',
        source = '',
        sourceId = '',
        locked: boolean | undefined = undefined,
    ): Signal<Array<SkillIncrease>> {
        return computed(() => {
            const flatRecursion = 2;

            const currentClass = this.class();
            const companionLevel = this.level();

            // When animal companion species and levels are checked for skill increases,
            // we don't care about the character level, but always use the animal companion's level.
            const levels = new Array<AnimalCompanionLevel | AnimalCompanionAncestry>(
                currentClass.ancestry(),
                ...currentClass.levels().filter(level => level.number >= 0 && level.number <= companionLevel),
            );

            // When specializations are checked for skill increases,
            // we want to be certain we don't get a specialization that is taken on a higher character level
            const specializations =
                currentClass.specializations().filter(spec => spec.level >= minLevelNumber && spec.level <= maxLevelNumber);

            return new Array<SkillIncrease>(
                ...levels.map(level =>
                    level.skillChoices.map(choice =>
                        choice.increases.filter(increase =>
                            matchStringFilter({ value: increase.name, match: skillName })
                            && matchStringFilter({ value: increase.source, match: source })
                            && matchStringFilter({ value: increase.sourceId, match: sourceId })
                            && matchBooleanFilter({ value: increase.locked, match: locked }),
                        ),
                    ),
                ).flat(flatRecursion),
                ...specializations.map((spec, index) =>
                    spec.skillChoices
                        // Every animal companion specialization adds extra skill increases if it is the first specialization.
                        // Only the first specialization may add these "First specialization" increases.
                        .filter(choice => (choice.source !== 'First specialization' || index === 0))
                        .map(choice =>
                            choice.increases.filter(increase =>
                                matchStringFilter({ value: increase.name, match: skillName })
                                && matchStringFilter({ value: increase.source, match: source })
                                && matchStringFilter({ value: increase.sourceId, match: sourceId })
                                && matchBooleanFilter({ value: increase.locked, match: locked }),
                            ),
                        ),
                ).flat(flatRecursion),
            );
        });
    }
}
