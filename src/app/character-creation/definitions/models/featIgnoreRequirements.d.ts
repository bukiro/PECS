import { FeatRequirements } from './featRequirements';

export namespace FeatIgnoreRequirements {
    export interface FeatIgnoreRequirement {
        condition: Array<FeatRequirements.ComplexRequirement>;
        requirement: string;
    }
}
