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
        creatureToTest?: string;
        hasThisFeat?: boolean;
        isOnLevel?: RequirementExpectation;
        countLores?: { query: RequirementBasicQuery, expected?: RequirementExpectation }[];
        countAncestries?: { query: RequirementBasicQuery, expected?: RequirementExpectation }[];
        countBackgrounds?: { query: RequirementBasicQuery, expected?: RequirementExpectation }[];
        countHeritages?: { query: RequirementBasicQuery, expected?: RequirementExpectation }[];
        countSpells?: { query: RequirementQueryCountSpells, expected?: RequirementExpectation }[];
        skillLevels?: { query: RequirementQuerySkillLevel, expected?: RequirementExpectation }[];
        countDeities?: { query: RequirementQueryCountDeities, expected?: RequirementExpectation }[];
        hasAnimalCompanion: RequirementExpectation;
        hasFamiliar: RequirementExpectation;
        countFeats?: { query: RequirementQueryCountFeats, expected?: RequirementExpectation }[];
        matchesAnyOfAligments?: { query: string, expected?: RequirementExpectation }[];
        countClasses?: { query: RequirementQueryClass, expected?: RequirementExpectation }[];
        countSenses?: { query: RequirementBasicQuery, expected?: RequirementExpectation }[];
        countClassSpellcastings?: { query: RequirementQueryClassSpellCasting, expected?: RequirementExpectation }[];
        countLearnedSpells?: { query: RequirementBasicQuery, expected: RequirementExpectation }[];
        countSpeeds?: { query: RequirementBasicQuery, expected: RequirementExpectation }[];
        countFavoredWeapons?: { query: RequirementQueryFavoredWeapon, expected: RequirementExpectation }[];
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
        met: boolean,
        desc: string;
    }
}

