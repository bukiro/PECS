import {
    ComplexValueArithmetic,
    ComplexValueExact,
    ComplexValueListIndex,
    ComplexValueMeetsAll,
    ComplexValueMeetsAny,
    DomainValue,
} from 'src/libs/shared/evaluation/util/models/complex-value';

export type ComplexSpellGainValue =
    DomainValue<ComplexSpellGainValue>
    | ComplexValueExact
    | ComplexValueMeetsAll<ComplexSpellGainValue>
    | ComplexValueMeetsAny<ComplexSpellGainValue>
    | ComplexValueArithmetic<ComplexSpellGainValue>
    | ComplexValueListIndex<ComplexSpellGainValue>;
