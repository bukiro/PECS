import { AbilityBoost } from 'src/libs/shared/definitions/creature-properties/ability-boost';
import { CreatureSizes } from 'src/libs/shared/definitions/creature-sizes';
import { CreatureTypeIds } from 'src/libs/shared/definitions/creature-type-ids';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { FeatChoice } from 'src/libs/shared/definitions/models/feat-choice';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { Skill } from '../../skills/skill';
import { SkillIncrease } from '../../skills/skill-increase';
import { Creature } from '../creature';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { computed, Signal, signal } from '@angular/core';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Familiar>({
    primitives: [
        'originClass',
        'species',
    ],
    primitiveArrays: [
        'senses',
        'traits',
    ],
    serializableArrays: {
        customSkills:
            () => obj => Skill.from(obj),
    },
});

export class Familiar extends Creature implements Serializable<Familiar> {
    public readonly type: CreatureTypes = CreatureTypes.Familiar;
    public readonly typeId: CreatureTypeIds = CreatureTypeIds.Familiar;

    public originClass = '';
    public species = '';

    public senses: Array<string> = ['Low-Light Vision'];
    public traits: Array<string> = ['Minion'];

    public abilities: FeatChoice = FeatChoice.from({
        available: Defaults.familiarAbilities,
        id: '0-Feat-Familiar-0',
        source: 'Familiar',
        type: 'Familiar',
    });

    public readonly customSkills = signal([
        Skill.from({ name: 'Attack Rolls', type: 'Familiar Proficiency' }),
    ]);

    public readonly baseSize$$: Signal<number> = signal(CreatureSizes.Tiny).asReadonly();

    public get requiresConForHP(): boolean { return false; }

    public static from(values: MaybeSerialized<Familiar>, recastFns: RecastFns): Familiar {
        return new Familiar().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Familiar>, recastFns: RecastFns): Familiar {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Familiar> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): Familiar {
        return Familiar.from(this, recastFns);
    }

    public isEqual(compared: Partial<Familiar>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isFamiliar(): this is Familiar {
        return true;
    }

    //Other implementations require conModifier.
    public baseHP$$(charLevel: number): Signal<{ result: number; bonuses: Array<BonusDescription> }> {
        const familiarHPMultiplier = 5;

        //Your familiar has 5 Hit Points for each of your levels.
        return computed(() => ({
            result: familiarHPMultiplier * charLevel,
            bonuses: [
                {
                    title: 'Familiar base HP',
                    subline: '(multiplied by character level)',
                    value: `${ familiarHPMultiplier } (${ familiarHPMultiplier * charLevel })`,
                },
            ],
        }));
    }

    // TODO: Why speeds[1]? Please investigate and explain or resolve.
    public baseSpeed$$(speedName: string): Signal<{ result: number; explain: string }> {
        return computed(() => {
            const speeds = this.speeds();

            let explain = '';
            let sum = 0;

            if (speedName === speeds[1]?.name) {
                sum = Defaults.defaultFamiliarSpeed;
                explain = `\nBase speed: ${ sum }`;
            }

            return { result: sum, explain: explain.trim() };
        });
    }

    public abilityBoosts$$(): Signal<Array<AbilityBoost>> { return signal<Array<AbilityBoost>>([]).asReadonly(); }

    public skillIncreases$$(): Signal<Array<SkillIncrease>> { return signal<Array<SkillIncrease>>([]).asReadonly(); }
}
