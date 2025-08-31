import { computed, Signal } from '@angular/core';
import { CreatureInherentSensesAdapter } from './creature-inherent-senses-adapter';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';

export class AnimalCompanionInherentSensesAdapter implements CreatureInherentSensesAdapter {

    public readonly inherentSenses$$: Signal<Array<string>> = computed(() =>
        this._ancestrySenses$$(),
    );

    private readonly _ancestrySenses$$: Signal<Array<string>> = computed(() => this._companion.class().ancestry().senses);

    constructor(
        private readonly _companion: AnimalCompanion,
    ) { }

}
