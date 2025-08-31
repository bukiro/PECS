
import { signal } from '@angular/core';
import { setupSerializationWithHelpers } from '../../../serialization/util/utils/serialization';
import { Serialized, MaybeSerialized, Serializable } from '../../../serialization/util/models/serializable';
import { FeatGain } from './feat-gain';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { FeatIgnoreRequirement } from './feat-ignore-requirements';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<FeatChoice>({
    primitives: [
        'available',
        'bonus',
        'id',
        'insertLevel',
        'insertClass',
        'level',
        'showOnSheet',
        'autoSelectIfPossible',
        'showOnCurrentLevel',
        'source',
        'specialChoice',
        'useHalfLevel',
        'type',
    ],
    primitiveArrays: [
        'filter',
    ],
    primitiveObjectArrays: [
        'ignoreRequirements',
    ],
    serializableArrays: {
        feats: recastFns => obj => FeatGain.from(obj, recastFns),
    },
});

export class FeatChoice implements Serializable<FeatChoice> {
    public available = 0;
    public bonus = false;
    public id = '';
    /**
     * If insertLevel is set, this featChoice is placed at the designated class level when granted by a feat.
     * I.e. if a feat contains a FeatChoice with insertLevel = 5, the choice is added to level 5 regardless of when the feat was taken.
     */
    public insertLevel = 0;
    /**
     * If insertClass is set, this featChoice is only granted by a feat if the character class name matches this name.
     * This is especially useful for class choices (hunter's edge, rogue racket, bloodline etc.)
     * that don't give certain benefits when multiclassing.
     */
    public insertClass = '';
    public level = 0;
    /**
     * If showOnSheet is set, this choice is intended to be made on the character sheet instead of while building the character.
     * This is relevant for features like Combat Flexibility.
     */
    public showOnSheet = false;
    /**
     * If autoSelectIfPossible is set, and there are exactly as many feats available as can be taken, those feats are automatically taken.
     * The choice is only ever displayed if there are more feats available than there are allowed to take.
     * Should be used sparingly and only in combination with a filter to save processing power.
     */
    public autoSelectIfPossible = false;
    /**
     * If showOnCurrentLevel is set, this choice is always shown at the current character level.
     * This allows it to use the current level for all its requirements.
     * This is relevant for feats like Raging Intimidation.
     */
    public showOnCurrentLevel = false;
    public source = '';
    /**
     * For special choices, we don't really use true feats, but make choices that can best be represented by the extensive feat structure.
     * In this case, we don't go looking for feats with a certain trait, but rely completely on the filter.
     * The choice's type will be the choice title in the character configuration.
     */
    public specialChoice = false;
    /**
     * Feats may give feat choices that allow feats at half the level where the feat choice is selected.
     * If `showOnSheet` is true, half the character level is used.
     * It will always be rounded down.
     */
    public useHalfLevel = false;
    public type = '';
    public filter: Array<string> = [];

    /**
     * You can add requirements to the ignore list.
     * These get evaluated as complexreqs and must result in one of the following to disable the requirement:
     * - "levelreq"
     * - "abilityreq"
     * - "featreq"
     * - "skillreq"
     * - "heritagereq"
     * - "complexreq"
     * - "dedicationlimit"
     */
    public ignoreRequirements: Array<FeatIgnoreRequirement> = [];

    public readonly feats = signal<Array<FeatGain>>([]);

    public static from(values: MaybeSerialized<FeatChoice>, recastFns: RecastFns): FeatChoice {
        return new FeatChoice().with(values, recastFns);
    }

    public with(values: MaybeSerialized<FeatChoice>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<FeatChoice> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return FeatChoice.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<FeatChoice>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
