import { AbilityBoost } from 'src/libs/shared/definitions/creature-properties/ability-boost';
import { CreatureSizes } from 'src/libs/shared/definitions/creature-sizes';
import { CreatureTypeIds } from 'src/libs/shared/definitions/creature-type-ids';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { FeatChoice } from 'src/libs/shared/definitions/models/feat-choice';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { Skill } from '../../skills/skill';
import { SkillIncrease } from '../../skills/skill-increase';
import { Creature } from '../creature';

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

    protected _customSkills = new OnChangeArray(
        new Skill('', 'Attack Rolls', 'Familiar Proficiency'),
    );

    public get requiresConForHP(): boolean { return false; }

    public static from(values: DeepPartial<Familiar>, recastFns: RecastFns): Familiar {
        return new Familiar().with(values, recastFns);
    }

    public with(values: DeepPartial<Familiar>, recastFns: RecastFns): Familiar {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<Familiar> {
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

    public baseSize(): number {
        return CreatureSizes.Tiny;
    }

    //Other implementations require conModifier.
    public baseHP(charLevel: number): { result: number; explain: string } {
        let explain = '';
        let classHP = 0;
        const familiarHPMultiplier = 5;

        //Your familiar has 5 Hit Points for each of your levels.
        classHP = familiarHPMultiplier * charLevel;
        explain = `Familiar base HP: ${ classHP }`;

        return { result: classHP, explain: explain.trim() };
    }

    public baseSpeed(speedName: string): { result: number; explain: string } {
        let explain = '';
        let sum = 0;

        if (speedName === this.speeds[1].name) {
            sum = Defaults.defaultFamiliarSpeed;
            explain = `\nBase speed: ${ sum }`;
        }

        return { result: sum, explain: explain.trim() };
    }

    public abilityBoosts(): Array<AbilityBoost> { return []; }

    public skillIncreases(): Array<SkillIncrease> { return []; }
}
