import { Signal, signal } from '@angular/core';
import { CreatureSpellCollectionAdapter } from './creature-spell-collection-adapter';
import { SpellGainAggregate } from '../../models/spell-gain-aggregate';

const zeroArray$$ = signal([]).asReadonly();

export class NullSpellCollectionAdapter implements CreatureSpellCollectionAdapter {

    public takenSpells$$(): Signal<Array<SpellGainAggregate>> {
        return zeroArray$$;
    }

    public takenSpellsOfSpellCasting$$(): Signal<Array<SpellGainAggregate>> {
        return zeroArray$$;
    }

}
