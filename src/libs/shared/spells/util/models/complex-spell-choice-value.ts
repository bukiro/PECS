import {
    ComplexValueArithmetic,
    ComplexValueContext,
    ComplexValueExact,
    ComplexValueListIndex,
    ComplexValueMeetsAll,
    ComplexValueMeetsAny,
    DomainValue,
    DomainValueParameters,
} from 'src/libs/shared/evaluation/util/models/complex-value';
import { SpellChoice } from './spell-choice';

export interface ComplexSpellChoiceValueContext extends ComplexValueContext {
    choice: SpellChoice;
    highestSpellLevelOfCasting: number;
}

export type ComplexSpellChoiceValue =
    DomainValue<ComplexSpellChoiceValue>
    | ComplexValueExact
    | ComplexValueMeetsAll<ComplexSpellChoiceValue>
    | ComplexValueMeetsAny<ComplexSpellChoiceValue>
    | ComplexValueArithmetic<ComplexSpellChoiceValue>
    | ComplexValueListIndex<ComplexSpellChoiceValue>
    | ComplexSpellChoiceValueChoiceLevel<ComplexSpellChoiceValue>
    | ComplexSpellChoiceValueHighestSpellLevelOfCasting<ComplexSpellChoiceValue>
    | ComplexSpellChoiceValueChoiceAvailable<ComplexSpellChoiceValue>;


export interface ComplexSpellChoiceValueChoiceLevel<ChildValue> { choiceLevel: DomainValueParameters<ChildValue> }
export interface ComplexSpellChoiceValueHighestSpellLevelOfCasting<ChildValue> { highestSpellLevelOfCasting: DomainValueParameters<ChildValue> }
export interface ComplexSpellChoiceValueChoiceAvailable<ChildValue> { choiceAvailable: DomainValueParameters<ChildValue> }
