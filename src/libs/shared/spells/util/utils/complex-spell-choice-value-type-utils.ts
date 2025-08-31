import { DomainValueBasicProps } from 'src/libs/shared/evaluation/util/models/complex-value';
import {
    ComplexSpellChoiceValueChoiceAvailable,
    ComplexSpellChoiceValueChoiceLevel,
    ComplexSpellChoiceValueHighestSpellLevelOfCasting,
} from '../models/complex-spell-choice-value';

export function isComplexSpellChoiceValueChoiceLevel<ChildValue>(complexValue: object | ComplexSpellChoiceValueChoiceLevel<ChildValue> & DomainValueBasicProps,
): complexValue is ComplexSpellChoiceValueChoiceLevel<ChildValue> & DomainValueBasicProps {
    return 'choiceLevel' in complexValue && !!complexValue.choiceLevel;
}

export function isComplexSpellChoiceValueHighestSpellLevelOfCasting<ChildValue>(complexValue: object | ComplexSpellChoiceValueHighestSpellLevelOfCasting<ChildValue> & DomainValueBasicProps,
): complexValue is ComplexSpellChoiceValueHighestSpellLevelOfCasting<ChildValue> & DomainValueBasicProps {
    return 'highestSpellLevelOfCasting' in complexValue && !!complexValue.highestSpellLevelOfCasting;
}

export function isComplexSpellChoiceValueChoiceAvailable<ChildValue>(complexValue: object | ComplexSpellChoiceValueChoiceAvailable<ChildValue> & DomainValueBasicProps,
): complexValue is ComplexSpellChoiceValueChoiceAvailable<ChildValue> & DomainValueBasicProps {
    return 'choiceAvailable' in complexValue && !!complexValue.choiceAvailable;
}
