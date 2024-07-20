import { BonusTypes } from 'src/libs/shared/definitions/bonus-types';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<EffectGain>({
    primitives: [
        'affected',
        'value',
        'setValue',
        'toggle',
        'conditionalToggle',
        'show',
        'type',
        'duration',
        'maxDuration',
        'resonant',
        'source',
        'sourceId',
        'spellSource',
        'title',
        'quickEffect',
    ],
    primitiveArrays: [
        'cumulative',
    ],
});

export class EffectGain implements Serializable<EffectGain> {
    public affected = '';
    /**
     * Add this number to the target value.
     * Gets eval()-ed to determine the actual value.
     * Gets applied if parseInt(value, 10) != 0
     */
    public value = '0';
    /**
     * Set the target value to this number and ignore item, proficiency and untyped effects.
     * Gets eval()-ed to determine the actual value.
     * Gets applied if (setValue);
     * (eval(setValue) == null) will throw out the effect - this can be used for effects that only give a value under a certain condition.
     * Hint: "you gain an X Speed" effects do not stack and should use setValue.
     */
    public setValue = '';
    /** Set if the effect does not need a value, but still needs to be applied. */
    public toggle = false;
    /** An effect that has a conditional toggle will be toggle==true if the condition evaluates to a nonzero value. */
    public conditionalToggle = '';
    /**
     * Effects will be displayed on top of the character sheet if show = true, not shown if show = false,
     * or otherwise shown if they match a certain list of effects that should always show.
     */
    public show?: boolean;
    public type: BonusTypes = BonusTypes.Untyped;
    public duration = 0;
    public maxDuration = 0;
    /** A quick effect does not show up in a value's effects editing list, but is controlled via quick buttons */
    public quickEffect = false;
    /** A resonant effect only applies if the carrying item is slotted into a wayfinder. */
    public resonant = false;
    /** source and sourceId are copied from conditions and used to track temporary HP. */
    public source = '';
    public sourceId = '';
    /** spellSource is copied from conditions and used in value eval()s. Also only used to calculate temporary HP so far. */
    public spellSource = '';
    /**
     * The title will be shown instead of the value if it is set.
     * It can be calculated like the value, and use the value for its calculations, but should result in a string.
     */
    public title = '';

    /** If the effect has a type, cumulative lists all effect sources (of the same type) that it is cumulative with. */
    public cumulative: Array<string> = [];

    public static from(values: DeepPartial<EffectGain>): EffectGain {
        return new EffectGain().with(values);
    }

    public with(values: DeepPartial<EffectGain>): EffectGain {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<EffectGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): EffectGain {
        return EffectGain.from(this);
    }

    public isEqual(compared: Partial<EffectGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
