import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

export namespace FeatRequirements {
    export interface AbilityRequirement {
        ability: string;
        value: number;
    }

    export interface SkillRequirement {
        skill: string;
        value: number;
    }

    export interface ComplexRequirement {
        alwaysTrue: boolean;
        creatureToTest?: CreatureTypes;
        hasThisFeat?: boolean;
        isOnLevel?: RequirementExpectation;
        countLores?: Array<{ query: RequirementBasicQuery; expected?: RequirementExpectation }>;
        countAncestries?: Array<{ query: RequirementBasicQuery; expected?: RequirementExpectation }>;
        countBackgrounds?: Array<{ query: RequirementBasicQuery; expected?: RequirementExpectation }>;
        countHeritages?: Array<{ query: RequirementBasicQuery; expected?: RequirementExpectation }>;
        countSpells?: Array<{ query: RequirementQueryCountSpells; expected?: RequirementExpectation }>;
        skillLevels?: Array<{ query: RequirementQuerySkillLevel; expected?: RequirementExpectation }>;
        countDeities?: Array<{ query: RequirementQueryCountDeities; expected?: RequirementExpectation }>;
        hasAnimalCompanion: RequirementExpectation;
        hasFamiliar: RequirementExpectation;
        countFeats?: Array<{ query: RequirementQueryCountFeats; expected?: RequirementExpectation }>;
        matchesAnyOfAligments?: Array<{ query: string; expected?: RequirementExpectation }>;
        countClasses?: Array<{ query: RequirementQueryClass; expected?: RequirementExpectation }>;
        countSenses?: Array<{ query: RequirementBasicQuery; expected?: RequirementExpectation }>;
        countClassSpellcastings?: Array<{ query: RequirementQueryClassSpellCasting; expected?: RequirementExpectation }>;
        countLearnedSpells?: Array<{ query: RequirementBasicQuery; expected: RequirementExpectation }>;
        countSpeeds?: Array<{ query: RequirementBasicQuery; expected: RequirementExpectation }>;
        countFavoredWeapons?: Array<{ query: RequirementQueryFavoredWeapon; expected: RequirementExpectation }>;
    }

    export interface RequirementBasicQuery {
        allOfNames?: string;
        anyOfNames?: string;
        any?: boolean;
    }

    export interface RequirementQueryCountSpells extends RequirementBasicQuery {
        ofSpellCasting?: RequirementQuerySpellCasting;
    }

    export interface RequirementQuerySkillLevel extends RequirementBasicQuery {
        anyOfTypes?: string;
        matchingDivineSkill?: boolean;
    }

    export interface RequirementQueryCountFeats extends RequirementBasicQuery {
        havingAnyOfTraits?: string;
        havingAllOfTraits?: string;
        excludeCountAs?: boolean;
    }

    export interface RequirementQueryCountDeities extends RequirementBasicQuery {
        firstOnly?: boolean;
        secondOnly?: boolean;
        allowPhilosophies?: boolean;
        matchingAlignment?: string;
        havingAllOfFonts?: string;
        havingAnyOfSkills?: string;
        havingAnyOfPrimaryDomains?: string;
        havingAnyOfAlternateDomains?: string;
        havingAnyOfDomains?: string;
    }

    export interface RequirementQuerySpellCasting {
        havingAnyOfClassNames?: string;
        havingAnyOfCastingTypes?: string;
        havingAnyOfTraditions?: string;
        havingSpellsOfLevelGreaterOrEqual?: number;
    }

    export interface RequirementQueryClassSpellCasting extends RequirementQuerySpellCasting {
        any?: boolean;
        beingOfPrimaryClass?: boolean;
        beingOfFamiliarsClass?: boolean;
    }

    export interface RequirementQueryClass extends RequirementBasicQuery {
        havingLessHitpointsThan?: number;
        havingMoreHitpointsThan?: number;
    }

    export interface RequirementQueryFavoredWeapon extends RequirementBasicQuery {
        havingAnyOfProficiencies?: string;
    }

    export interface RequirementExpectation {
        isTrue?: boolean;
        isFalse?: boolean;
        isEqual?: number;
        isGreaterThan?: number;
        isLesserThan?: number;
    }

    export interface FeatRequirementResult {
        met: boolean;
        desc: string;
        ignored?: boolean;
    }
}

