import { FeatRequirements } from 'src/libs/shared/feats/util/models/feat-requirements';
import { Signal, signal } from '@angular/core';
import { FeatRequirementsAdapter } from './feat-requirements.adapter';

const emptyArray = signal([]).asReadonly();
const cannotChoose = signal({
    value: false,
    results: [],
}).asReadonly();

export class NullFeatRequirementsAdapter implements FeatRequirementsAdapter {

    public createIgnoreRequirementList$$(): Signal<Array<string>> {
        return emptyArray;
    }

    public canChoose$$(): Signal<FeatRequirements.CanChooseResult> {
        return cannotChoose;
    }
}
