import { FeatRequirements } from './feat-requirements';

export type FeatIgnoreRequirementTarget =
    'levelreq'
    | 'abilityreq'
    | 'featreq'
    | 'skillreq'
    | 'heritagereq'
    | 'complexreq'
    | 'dedicationlimit';

export interface FeatIgnoreRequirement {
    condition: Array<FeatRequirements.ComplexRequirement>;
    requirement: FeatIgnoreRequirementTarget;
}
