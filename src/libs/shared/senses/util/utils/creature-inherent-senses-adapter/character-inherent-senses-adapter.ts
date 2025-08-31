import { computed, Signal } from '@angular/core';
import { CreatureInherentSensesAdapter } from './creature-inherent-senses-adapter';
import { Character } from 'src/libs/shared/character/util/models/character';

export class CharacterInherentSensesAdapter implements CreatureInherentSensesAdapter {

    public readonly inherentSenses$$: Signal<Array<string>> = computed(() =>
        [
            ...this._ancestrySenses$$(),
            ...this._heritageSenses$$(),
        ],
    );

    private readonly _ancestrySenses$$: Signal<Array<string>> = computed(() => this._character.class().ancestry().senses);

    private readonly _heritageSenses$$: Signal<Array<string>> = computed(() => this._character.class().heritage().senses);

    constructor(
        private readonly _character: Character,
    ) { }

}
