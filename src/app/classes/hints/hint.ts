import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { heightenedTextFromDescSets } from 'src/libs/shared/util/description-utils';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { EffectGain } from '../effects/effect-gain';
import { HeightenedDescriptionVariableCollection } from '../spells/heightened-description-variable-collection';

const { assign, forExport, isEqual } = setupSerialization<Hint>({
    // We want the active hints to be reset when loading characters.
    // active1 through active5 are not included in importing and exporting.
    primitives: [
        'desc',
        'displayOnly',
        'extraActivations',
        'minLevel',
        'resonant',
        'replaceTitle',
        'showon',
    ],
    primitiveArrays: [
        'conditionChoiceFilter',
    ],
    primitiveObjectArrays: [
        'replaceSource',
    ],
    serializableArrays: {
        effects:
            () => obj => EffectGain.from(obj),
        heightenedDescs:
            () => obj => HeightenedDescriptionVariableCollection.from(obj),
    },
});

export class Hint implements Serializable<Hint> {
    public active = false;
    public active2 = false;
    public active3 = false;
    public active4 = false;
    public active5 = false;
    public desc = '';
    public displayOnly = false;
    /**
     * If extraActivations is 1 through 4, up to four more activation boxes are shown.
     * Their state can be accessed in effect calculations with object.active2 through object.active5.
     */
    public extraActivations = 0;
    public minLevel = 0;
    /** On an aeon stone, hints can be resonant powers. These only get shown if the aeon stone is slotted in a wayfinder. */
    public resonant = false;
    /** Replace the title of the hint. */
    public replaceTitle = '';
    public showon = '';

    /** If conditionChoiceFilter is set, only show this hint if the condition that the hint comes from has a matching choice active. */
    public conditionChoiceFilter: Array<string> = [];

    /**
     * Replace the information source that is displayed when more information is shown.
     * Does not replace the title.
     */
    public replaceSource: Array<{ source: string; type: 'feat' }> = [];

    public effects: Array<EffectGain> = [];
    public heightenedDescs: Array<HeightenedDescriptionVariableCollection> = [];

    public get anyActive(): boolean {
        return this.active || this.active2 || this.active3 || this.active4 || this.active5;
    }

    public static from(values: DeepPartial<Hint>): Hint {
        return new Hint().with(values);
    }

    public with(values: DeepPartial<Hint>): Hint {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<Hint> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Hint {
        return Hint.from(this);
    }

    public isEqual(compared: Partial<Hint>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public deactivateAll(): void {
        this.active = this.active2 = this.active3 = this.active4 = this.active5 = false;
    }

    public heightenedText(text: string, levelNumber: number): string {
        return heightenedTextFromDescSets(text, levelNumber, this.heightenedDescs);
    }
}
