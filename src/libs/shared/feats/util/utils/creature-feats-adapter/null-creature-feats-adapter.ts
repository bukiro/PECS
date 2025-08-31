import { signal, Signal } from '@angular/core';
import { Feat } from '../../models/feat';
import { FeatGain } from '../../models/feat-gain';
import { CreatureFeatsAdapter } from './creature-feats-adapter';
import { FeatTakenContext } from '../../models/feat-taken-context';
import { NullFeatRequirementsAdapter } from '../feat-requirements-adapter/null-feat-requirements.adapter';

/** A feats adapter for creatures that don't have feats. */
export class NullCreatureFeatsAdapter implements CreatureFeatsAdapter {
    public readonly featRequirementsAdapter = new NullFeatRequirementsAdapter();
    private readonly _nullArray = signal([]).asReadonly();
    private readonly _nullNumber = signal(0).asReadonly();

    public feats$$(): Signal<Array<Feat>> {
        return this._nullArray;
    }

    public featsWithContext$$(): Signal<Array<FeatTakenContext>> {
        return this._nullArray;
    }

    public featGains$$(): Signal<Array<FeatGain>> {
        return this._nullArray;
    }

    public featsAtLevel$$(): Signal<Array<Feat>> {
        return this._nullArray;
    }

    public featsTakenAtLevel$$(): Signal<Array<Feat>> {
        return this._nullArray;
    }

    public hasFeatAtLevel$$(): Signal<number> {
        return this._nullNumber;
    }

    public hasTakenFeatAtLevel$$(): Signal<number> {
        return this._nullNumber;
    }
}
