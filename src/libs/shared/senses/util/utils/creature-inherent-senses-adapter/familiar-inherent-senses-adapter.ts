import { computed, Signal } from '@angular/core';
import { CreatureInherentSensesAdapter } from './creature-inherent-senses-adapter';
import { Familiar } from 'src/libs/shared/creatures/util/models/familiar';

export class FamiliarInherentSensesAdapter implements CreatureInherentSensesAdapter {

    public readonly inherentSenses$$: Signal<Array<string>> = computed(() =>
        this._familiar.senses(),
    );

    constructor(
        private readonly _familiar: Familiar,
    ) { }

}
