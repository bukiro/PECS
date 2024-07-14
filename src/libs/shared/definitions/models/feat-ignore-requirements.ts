import { FeatRequirements } from './feat-requirements';

export namespace FeatIgnoreRequirements {
    export interface FeatIgnoreRequirement {
        condition: Array<FeatRequirements.ComplexRequirement>;
        requirement: string;
    }
}
