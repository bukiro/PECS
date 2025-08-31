
import { EffectGain } from '../../../effects/util/models/effect-gain';
import { HeightenedDescriptionVariableCollection } from '../../../heightened-description/util/models/heightened-description-variable-collection';
import { computed, signal } from '@angular/core';
import { heightenedTextFromDescSets } from 'src/libs/shared/heightened-description/util/utils/description-utils';
import { MaybeSerialized, Serializable, Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';

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
    public active = signal(false);
    public active2 = signal(false);
    public active3 = signal(false);
    public active4 = signal(false);
    public active5 = signal(false);
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

    public readonly anyActive$$ = computed(() => this.active() || this.active2() || this.active3() || this.active4() || this.active5());

    public static from(values: MaybeSerialized<Hint>): Hint {
        return new Hint().with(values);
    }

    public with(values: MaybeSerialized<Hint>): this {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Hint> {
        return {
            ...forExport(this),
        };
    }

    public clone(): this {
        return Hint.from(this) as this;
    }

    public isEqual(compared: Partial<Hint>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public deactivateAll(): void {
        this.active.set(false);
        this.active2.set(false);
        this.active3.set(false);
        this.active4.set(false);
        this.active5.set(false);
    }

    public heightenedText(text: string, levelNumber: number): string {
        return heightenedTextFromDescSets(text, levelNumber, this.heightenedDescs);
    }
}
