import { signal } from '@angular/core';
import { CreatureSizes } from '../../models/creature-sizes';
import { CreatureSizeAdapter } from './creature-size-adapter';
import { applySizeChange } from '../creature-size-utils';
import { Familiar } from 'src/libs/shared/creatures/util/models/familiar';

export class FamiliarSizeAdapter extends CreatureSizeAdapter {

    public readonly baseSize$$ = signal(applySizeChange({
        change: CreatureSizes.Tiny,
        title: 'Familiar Base Size',
    })).asReadonly();

    constructor(familiar: Familiar) {
        super(familiar);
    }

}
