import { Feat } from 'src/libs/shared/feats/util/models/feat';
import { FeatChoice } from 'src/libs/shared/feats/util/models/feat-choice';
import { FeatRequirements } from 'src/libs/shared/feats/util/models/feat-requirements';
import { Signal } from '@angular/core';

export abstract class FeatRequirementsAdapter {

    /**
     * Create a list of all requirements that can be ignored, based on whether the ignore requirement is met.
     * Catches deprecated string values by automatically succeeding.
     *
     * @param feat
     * @param levelNumber
     * @param choice
     * @returns
     */
    public abstract createIgnoreRequirementList$$(
        feat: Feat,
        context: { charLevel: number; choice?: FeatChoice },
    ): Signal<Array<string>>;

    /**
     * This function evaluates all the possible requirements for taking a feat.
     * Returns true only if all the requirements are true. If the feat doesn't have a requirement, it is always true.
     *
     * @param feat
     * @param context
     * @param options
     * @returns
     */
    public abstract canChoose$$(
        feat: Feat,
        // charLevel is the level the character is at when the feat is taken.
        // choiceLevel is choice.level and may differ, for example when you take a 1st-level general feat at 8th level via General Training.
        // It is only used for the level requirement.
        context?: { charLevel?: number; choiceLevel?: number },
        options?: { ignoreRequirementsList?: Array<string>; displayOnly?: boolean },
    ): Signal<FeatRequirements.CanChooseResult>;
}
