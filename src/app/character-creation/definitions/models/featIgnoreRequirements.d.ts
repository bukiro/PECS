import { FeatRequirements } from './featRequirements';

export namespace FeatIgnoreRequirements {
    export interface FeatIgnoreRequirement {
        condition: FeatRequirements.ComplexRequirement[];
        requirement: string;
    }
}
