import {
    ComplexValueArithmetic,
    ComplexValueContext,
    ComplexValueExact,
    ComplexValueListIndex,
    ComplexValueMeetsAll,
    ComplexValueMeetsAny,
    DomainValue,
    DomainValueBasicProps,
} from 'src/libs/shared/evaluation/util/models/complex-value';
import { Feat } from './feat';

export namespace FeatRequirements {
    export interface AbilityRequirement {
        ability: string;
        value: number;
    }

    export interface SkillRequirement {
        skill: string;
        value: number;
    }

    export interface ComplexRequirementContext extends ComplexValueContext {
        feat: Feat;
    }

    export type ComplexRequirement =
        DomainValue<ComplexRequirement>
        | ComplexValueExact
        | ComplexValueMeetsAll<ComplexRequirement>
        | ComplexValueMeetsAny<ComplexRequirement>
        | ComplexValueArithmetic<ComplexRequirement>
        | ComplexValueListIndex<ComplexRequirement>
        | ComplexRequirementAlwaysTrue
        | ComplexRequirementHasThisFeat;

    /**
     * Some complex requirement are impossible to test in PECS (such as nationality).
     * These can be marked as alwaysTrue, and it is up to the player to determine them in the game.
     */
    export interface ComplexRequirementAlwaysTrue { alwaysTrue: boolean }
    /**
     * This literally asks if the feat that is checking requirements is already taken.
     * This is used to keep feats that invalidate their own requirements.
     * For example, Adopted Ancestry requires you not having the given Ancestry,
     * but when you take it, it gives you that ancestry.
     * `hasThisFeat` prevents the feat from removing itself automatically.
     **/
    export interface ComplexRequirementHasThisFeat extends DomainValueBasicProps { hasThisFeat: boolean }

    export interface FeatRequirementResult {
        met: boolean;
        desc: string;
        ignored?: boolean;
        skipped?: boolean;
    }

    export interface CanChooseResult {
        value: boolean;
        results: Array<FeatRequirementResult>;
    }
}

