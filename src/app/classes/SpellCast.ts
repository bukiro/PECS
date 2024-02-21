import { SpellGain } from 'src/app/classes/SpellGain';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport } = setupSerialization<SpellCast>({
    primitives: [
        'duration',
        'level',
        'name',
        'restrictionDesc',
        'target',
    ],
    primitiveArrays: [
        'hideChoices',
    ],
    primitiveObjectArrays: [
        'overrideChoices',
    ],
    serializables: {
        spellGain:
            () => obj => SpellGain.from(obj),
    },
});

export class SpellCast implements Serializable<SpellCast> {
    /** This duration can override the spell's standard duration when applying conditions. */
    public duration = 0;
    public level = 0;
    public name = '';
    /** Deities can add restrictions to the spells they grant. These are described here, but don't have a mechanical effect. */
    public restrictionDesc = '';
    public target: 'ally' | 'self' | '' = '';

    /**
     * If hideChoices contains any condition names,
     * the SpellCast does not allow you to make any choices to these conditions before you activate it.
     */
    public hideChoices: Array<string> = [];

    /** These choices can override the spell condition choices. This applies only if the choice exists on the condition. */
    public overrideChoices: Array<{ condition: string; choice: string }> = [];

    /** This is used automatically for sustained spells cast by items or activities. */
    public spellGain: SpellGain = new SpellGain();

    public static from(values: DeepPartial<SpellCast>): SpellCast {
        return new SpellCast().with(values);
    }

    public with(values: DeepPartial<SpellCast>): SpellCast {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<SpellCast> {
        return {
            ...forExport(this),
        };
    }

    public clone(): SpellCast {
        return SpellCast.from(this);
    }
}
