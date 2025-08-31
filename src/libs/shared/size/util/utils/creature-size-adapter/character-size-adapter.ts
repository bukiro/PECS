import { computed } from '@angular/core';
import { CreatureSizes } from '../../models/creature-sizes';
import { Character } from 'src/libs/shared/character/util/models/character';
import { CreatureSizeAdapter } from './creature-size-adapter';
import { applySizeChange } from '../creature-size-utils';

export class CharacterSizeAdapter extends CreatureSizeAdapter {

    public readonly baseSize$$ = computed(() => {
        const size = this._character.class().ancestry().size ?? CreatureSizes.Medium;

        return applySizeChange({
            change: size,
            title: 'Ancestry Base Size',
            bonuses: [],
        });
    });

    constructor(
        private readonly _character: Character,
    ) {
        super(_character);
    }

}
