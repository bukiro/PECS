import { Character } from 'src/libs/shared/character/util/models/character';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { CreatureTypes } from 'src/libs/shared/creatures/util/models/creature-types';

export interface ComplexValueResult { met: boolean; value: number }

export interface ComplexValueContext extends ComplexValueOptions {
    creature: Creature;
    character: Character;
    charLevel: number;
}

export interface ComplexValueOptions {
    // The character level at which to determine the option (if possible)
    charLevel?: number;
    // Determines values without applying effects and other temporary changes
    excludeTemporary?: boolean;
}

export interface ComplexValueExact { exact: number }
export interface ComplexValueMeetsAll<ChildValue> extends UseFirstValueParameters<ChildValue> { meetsAll: Array<ChildValue> }
export interface ComplexValueMeetsAny<ChildValue> extends UseFirstValueParameters<ChildValue> { meetsAny: Array<ChildValue> }
export interface ComplexValueArithmetic<ChildValue> { arithmetic: DualArithmeticValue<ChildValue> | MultiArithmeticValue<ChildValue> }
export interface ComplexValueListIndex<ChildValue> extends DomainValueParameters<ChildValue> { list: Array<ChildValue>; index: ChildValue }

export interface RoundArithmeticValue<ChildValue> {
    value: ChildValue;
}

export interface DualArithmeticValue<ChildValue> extends DomainValueParameters<ChildValue> {
    rounding?: 'up' | 'down';
    operator: '-' | '/';
    leftValue: ChildValue;
    rightValue: ChildValue;
}

export interface MultiArithmeticValue<ChildValue> extends DomainValueParameters<ChildValue> {
    rounding?: 'up' | 'down';
    operator: '+' | '*' | 'max' | 'min';
    values: Array<ChildValue>;
}

export interface DomainValueBasicProps {
    /** Designates a specific creature to test for these values */
    creatureToTest?: CreatureTypes;
}

export interface DomainValue<ChildValue> {
    creatureToTest?: CreatureTypes;
    characterLevel?: DomainValueParameters<ChildValue>;
    hasAlignment?: BooleanDomainValueParameters<ChildValue> & { query: CountBasicQuery };
    hasAnimalCompanion?: BooleanDomainValueParameters<ChildValue>;
    hasFamiliar?: BooleanDomainValueParameters<ChildValue>;
    countAncestries?: CountDomainValueParameters<ChildValue>;
    countBackgrounds?: CountDomainValueParameters<ChildValue>;
    countClasses?: CountDomainValueParameters<ChildValue> & { query: RequirementQueryClass };
    countClassSpellcastings?: CountDomainValueParameters<ChildValue> & { query: RequirementQueryClassSpellCasting };
    countDeities?: CountDomainValueParameters<ChildValue> & { query: RequirementQueryCountDeities };
    countFavoredWeapons?: CountDomainValueParameters<ChildValue> & { query: RequirementQueryFavoredWeapon };
    countFeats?: CountDomainValueParameters<ChildValue> & { query: RequirementQueryCountFeats };
    countHeritages?: CountDomainValueParameters<ChildValue>;
    countLearnedSpells?: CountDomainValueParameters<ChildValue>;
    countLores?: CountDomainValueParameters<ChildValue>;
    countSenses?: CountDomainValueParameters<ChildValue>;
    countSpeeds?: CountDomainValueParameters<ChildValue>;
    countSpells?: CountDomainValueParameters<ChildValue> & { query: RequirementQueryCountSpells };
    skillLevels?: ListDomainValueParameters<ChildValue> & { query: RequirementQuerySkillLevel };
    abilityModifiers?: ListDomainValueParameters<ChildValue>;
}

export interface DomainValueCharacterLevel<ChildValue> { characterLevel: DomainValueParameters<ChildValue> }
export interface DomainValueHasAlignment<ChildValue> { hasAlignment: BooleanDomainValueParameters<ChildValue> & { query: CountBasicQuery } }
export interface DomainValueHasAnimalCompanion<ChildValue> { hasAnimalCompanion: BooleanDomainValueParameters<ChildValue> }
export interface DomainValueHasFamiliar<ChildValue> { hasFamiliar: BooleanDomainValueParameters<ChildValue> }
export interface DomainValueCountAncestries<ChildValue> { countAncestries: CountDomainValueParameters<ChildValue> }
export interface DomainValueCountBackgrounds<ChildValue> { countBackgrounds: CountDomainValueParameters<ChildValue> }
export interface DomainValueCountClasses<ChildValue> { countClasses: CountDomainValueParameters<ChildValue> & { query: RequirementQueryClass } }
export interface DomainValueCountClassSpellcastings<ChildValue> { countClassSpellcastings: CountDomainValueParameters<ChildValue> & { query: RequirementQueryClassSpellCasting } }
export interface DomainValueCountDeities<ChildValue> { countDeities: CountDomainValueParameters<ChildValue> & { query: RequirementQueryCountDeities } }
export interface DomainValueCountFavoredWeapons<ChildValue> { countFavoredWeapons: CountDomainValueParameters<ChildValue> & { query: RequirementQueryFavoredWeapon } }
export interface DomainValueCountFeats<ChildValue> { countFeats: CountDomainValueParameters<ChildValue> & { query: RequirementQueryCountFeats } }
export interface DomainValueCountHeritages<ChildValue> { countHeritages: CountDomainValueParameters<ChildValue> }
export interface DomainValueCountLearnedSpells<ChildValue> { countLearnedSpells: CountDomainValueParameters<ChildValue> }
export interface DomainValueCountLores<ChildValue> { countLores: CountDomainValueParameters<ChildValue> }
export interface DomainValueCountSenses<ChildValue> { countSenses: CountDomainValueParameters<ChildValue> }
export interface DomainValueCountSpeeds<ChildValue> { countSpeeds: CountDomainValueParameters<ChildValue> }
export interface DomainValueCountSpells<ChildValue> { countSpells: CountDomainValueParameters<ChildValue> & { query: RequirementQueryCountSpells } }
export interface DomainValueSkillLevels<ChildValue> { skillLevels: ListDomainValueParameters<ChildValue> & { query: RequirementQuerySkillLevel } }
export interface DomainValueAbilityModifiers<ChildValue> { abilityModifiers: ListDomainValueParameters<ChildValue> }

export interface BooleanExpectation {
    isTrue?: true;
    isFalse?: true;
}

export interface ValueExpectation<ChildValue> extends BooleanExpectation {
    isEqual?: ChildValue;
    isGreaterThan?: ChildValue;
    isLesserThan?: ChildValue;
}

export interface UseValueParameters<ChildValue> {
    useValue?: ChildValue;
    // If a fallback is used, the "met" status is that of the fallback.
    fallBack?: ChildValue;
}

export interface UseFirstValueParameters<ChildValue> extends UseValueParameters<ChildValue> {
    useFirstAsValue?: true;
}

export interface BooleanDomainValueParameters<ChildValue> extends UseValueParameters<ChildValue> {
    expected?: BooleanExpectation;
}

export interface DomainValueParameters<ChildValue> extends BooleanDomainValueParameters<ChildValue> {
    expected?: ValueExpectation<ChildValue>;
    useAsValue?: true;
}

export interface CountDomainValueParameters<ChildValue> extends DomainValueParameters<ChildValue> {
    query?: CountBasicQuery;
    useAsValue?: never;
}

export interface ListDomainValueParameters<ChildValue> extends CountDomainValueParameters<ChildValue> {
    useHighestAsValue?: true;
    useLowestAsValue?: true;
}

export interface CountBasicQuery {
    // name is treated as an alias for anyOfNames, so queries can be written for a single name.
    name?: string;
    allOfNames?: string;
    anyOfNames?: string;
    anyNotOfNames?: string;
    any?: true;
}

export type RequirementQueryCountSpells = CountBasicQuery & {
    ofSpellCasting?: RequirementQuerySpellCasting;
};

export type RequirementQuerySkillLevel = CountBasicQuery & {
    anyOfTypes?: string;
    matchingDivineSkill?: true;
};

export type RequirementQueryCountFeats = CountBasicQuery & {
    havingAnyOfTraits?: string;
    havingAllOfTraits?: string;
    excludeCountAs?: true;
};

export type RequirementQueryCountDeities = CountBasicQuery & {
    firstOnly?: true;
    secondOnly?: true;
    allowPhilosophies?: true;
    matchingAlignment?: string;
    havingAllOfFonts?: string;
    havingAnyOfSkills?: string;
    havingAnyOfPrimaryDomains?: string;
    havingAnyOfAlternateDomains?: string;
    havingAnyOfDomains?: string;
};

export interface RequirementQuerySpellCasting {
    havingAnyOfClassNames?: string;
    havingAnyOfCastingTypes?: string;
    havingAnyOfTraditions?: string;
    havingSpellsOfLevelGreaterOrEqual?: number;
}

export interface RequirementQueryClassSpellCasting extends RequirementQuerySpellCasting {
    any?: true;
    beingOfPrimaryClass?: true;
    beingOfFamiliarsClass?: true;
}

export type RequirementQueryClass = CountBasicQuery & {
    havingLessHitpointsThan?: number;
    havingMoreHitpointsThan?: number;
};

export type RequirementQueryFavoredWeapon = CountBasicQuery & {
    havingAnyOfProficiencies?: string;
};
