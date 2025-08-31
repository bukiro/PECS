import { DomainValueBasicProps } from 'src/libs/shared/evaluation/util/models/complex-value';
import { FeatRequirements as FeatRequirements } from '../models/feat-requirements';

export function isComplexRequirementAlwaysTrue(complexValue: object | FeatRequirements.ComplexRequirementAlwaysTrue,
): complexValue is FeatRequirements.ComplexRequirementAlwaysTrue {
    return 'alwaysTrue' in complexValue && complexValue.alwaysTrue !== undefined;
}

export function isComplexRequirementHasThisFeat(complexValue: object | FeatRequirements.ComplexRequirementHasThisFeat & DomainValueBasicProps,
): complexValue is FeatRequirements.ComplexRequirementHasThisFeat & DomainValueBasicProps {
    return 'hasThisFeat' in complexValue && complexValue.hasThisFeat !== undefined;
}
