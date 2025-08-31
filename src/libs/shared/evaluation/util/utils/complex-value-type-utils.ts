import {
    DomainValueCharacterLevel,
    DomainValueHasAlignment,
    DomainValueHasAnimalCompanion,
    DomainValueHasFamiliar,
    DomainValueCountAncestries,
    DomainValueCountBackgrounds,
    DomainValueCountClasses,
    DomainValueCountClassSpellcastings,
    DomainValueCountDeities,
    DomainValueCountFavoredWeapons,
    DomainValueCountFeats,
    DomainValueCountHeritages,
    DomainValueCountLearnedSpells,
    DomainValueCountLores,
    DomainValueCountSenses,
    DomainValueCountSpeeds,
    DomainValueCountSpells,
    DomainValueSkillLevels,
    DomainValueBasicProps,
    DualArithmeticValue,
    MultiArithmeticValue,
    ComplexValueMeetsAll,
    ComplexValueMeetsAny,
    ComplexValueArithmetic,
    ComplexValueExact,
    ComplexValueListIndex,
    DomainValueAbilityModifiers,
} from '../models/complex-value';

export function isComplexValueExact(complexValue: object | ComplexValueExact,
): complexValue is ComplexValueExact {
    return 'exact' in complexValue && complexValue.exact !== undefined;
}

export function isComplexValueMeetsAll<ChildValue>(
    complexValue: object | ComplexValueMeetsAll<ChildValue>,
): complexValue is ComplexValueMeetsAll<ChildValue> {
    return 'meetsAll' in complexValue && !!complexValue.meetsAll;
}

export function isComplexValueMeetsAny<ChildValue>(
    complexValue: object | ComplexValueMeetsAny<ChildValue>,
): complexValue is ComplexValueMeetsAny<ChildValue> {
    return 'meetsAny' in complexValue && !!complexValue.meetsAny;
}

export function isComplexValueArithmetic<ChildValue>(
    complexValue: object | ComplexValueArithmetic<ChildValue>,
): complexValue is ComplexValueArithmetic<ChildValue> {
    return 'arithmetic' in complexValue && !!complexValue.arithmetic;
}

export function isComplexValueListIndex<ChildValue>(
    complexValue: object | ComplexValueListIndex<ChildValue>,
): complexValue is ComplexValueListIndex<ChildValue> {
    return 'list' in complexValue && 'index' in complexValue && !!complexValue.list && complexValue.index !== undefined;
}

export function isDualArithmeticValue<ChildValue>(
    arithmeticValue: DualArithmeticValue<ChildValue> | MultiArithmeticValue<ChildValue>,
): arithmeticValue is DualArithmeticValue<ChildValue> {
    return ['-', '/'].includes(arithmeticValue.operator);
}

export function isMultiArithmeticValue<ChildValue>(
    arithmeticValue: DualArithmeticValue<ChildValue> | MultiArithmeticValue<ChildValue>,
): arithmeticValue is MultiArithmeticValue<ChildValue> {
    return ['+', '*', 'max', 'min'].includes(arithmeticValue.operator);
}

export function isDomainValueCharacterLevel<ChildValue>(
    complexValue: object | DomainValueCharacterLevel<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueCharacterLevel<ChildValue> & DomainValueBasicProps {
    return 'characterLevel' in complexValue && !!complexValue.characterLevel;
}

export function isDomainValueHasAlignment<ChildValue>(
    complexValue: object | DomainValueHasAlignment<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueHasAlignment<ChildValue> & DomainValueBasicProps {
    return 'hasAlignment' in complexValue && !!complexValue.hasAlignment;
}

export function isDomainValueHasAnimalCompanion<ChildValue>(
    complexValue: object | DomainValueHasAnimalCompanion<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueHasAnimalCompanion<ChildValue> & DomainValueBasicProps {
    return 'hasAnimalCompanion' in complexValue && !!complexValue.hasAnimalCompanion;
}

export function isDomainValueHasFamiliar<ChildValue>(
    complexValue: object | DomainValueHasFamiliar<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueHasFamiliar<ChildValue> & DomainValueBasicProps {
    return 'hasFamiliar' in complexValue && !!complexValue.hasFamiliar;
}

export function isDomainValueCountAncestries<ChildValue>(
    complexValue: object | DomainValueCountAncestries<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueCountAncestries<ChildValue> & DomainValueBasicProps {
    return 'countAncestries' in complexValue && !!complexValue.countAncestries;
}

export function isDomainValueCountBackgrounds<ChildValue>(
    complexValue: object | DomainValueCountBackgrounds<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueCountBackgrounds<ChildValue> & DomainValueBasicProps {
    return 'countBackgrounds' in complexValue && !!complexValue.countBackgrounds;
}

export function isDomainValueCountClasses<ChildValue>(
    complexValue: object | DomainValueCountClasses<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueCountClasses<ChildValue> & DomainValueBasicProps {
    return 'countClasses' in complexValue && !!complexValue.countClasses;
}

export function isDomainValueCountClassSpellcastings<ChildValue>(
    complexValue: object | DomainValueCountClassSpellcastings<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueCountClassSpellcastings<ChildValue> & DomainValueBasicProps {
    return 'countClassSpellcastings' in complexValue && !!complexValue.countClassSpellcastings;
}

export function isDomainValueCountDeities<ChildValue>(
    complexValue: object | DomainValueCountDeities<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueCountDeities<ChildValue> & DomainValueBasicProps {
    return 'countDeities' in complexValue && !!complexValue.countDeities;
}

export function isDomainValueCountFavoredWeapons<ChildValue>(
    complexValue: object | DomainValueCountFavoredWeapons<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueCountFavoredWeapons<ChildValue> & DomainValueBasicProps {
    return 'countFavoredWeapons' in complexValue && !!complexValue.countFavoredWeapons;
}

export function isDomainValueCountFeats<ChildValue>(
    complexValue: object | DomainValueCountFeats<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueCountFeats<ChildValue> & DomainValueBasicProps {
    return 'countFeats' in complexValue && !!complexValue.countFeats;
}

export function isDomainValueCountHeritages<ChildValue>(
    complexValue: object | DomainValueCountHeritages<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueCountHeritages<ChildValue> & DomainValueBasicProps {
    return 'countHeritages' in complexValue && !!complexValue.countHeritages;
}

export function isDomainValueCountLearnedSpells<ChildValue>(
    complexValue: object | DomainValueCountLearnedSpells<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueCountLearnedSpells<ChildValue> & DomainValueBasicProps {
    return 'countLearnedSpells' in complexValue && !!complexValue.countLearnedSpells;
}

export function isDomainValueCountLores<ChildValue>(
    complexValue: object | DomainValueCountLores<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueCountLores<ChildValue> & DomainValueBasicProps {
    return 'countLores' in complexValue && !!complexValue.countLores;
}

export function isDomainValueCountSenses<ChildValue>(
    complexValue: object | DomainValueCountSenses<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueCountSenses<ChildValue> & DomainValueBasicProps {
    return 'countSenses' in complexValue && !!complexValue.countSenses;
}

export function isDomainValueCountSpeeds<ChildValue>(
    complexValue: object | DomainValueCountSpeeds<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueCountSpeeds<ChildValue> & DomainValueBasicProps {
    return 'countSpeeds' in complexValue && !!complexValue.countSpeeds;
}

export function isDomainValueCountSpells<ChildValue>(
    complexValue: object | DomainValueCountSpells<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueCountSpells<ChildValue> & DomainValueBasicProps {
    return 'countSpells' in complexValue && !!complexValue.countSpells;
}

export function isDomainValueSkillLevels<ChildValue>(
    complexValue: object | DomainValueSkillLevels<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueSkillLevels<ChildValue> & DomainValueBasicProps {
    return 'skillLevels' in complexValue && !!complexValue.skillLevels;
}

export function isDomainValueAbilityModifiers<ChildValue>(
    complexValue: object | DomainValueAbilityModifiers<ChildValue> & DomainValueBasicProps,
): complexValue is DomainValueAbilityModifiers<ChildValue> & DomainValueBasicProps {
    return 'abilityModifiers' in complexValue && !!complexValue.abilityModifiers;
}
