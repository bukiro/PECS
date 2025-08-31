import { Injectable, Signal, signal } from '@angular/core';
import { TimePeriods } from '../../util/models/time-periods';

@Injectable({
    providedIn: 'root',
})
export class TurnService {
    //yourTurn is 5 if it is your turn or 0 if not.
    private static readonly _yourTurn$$ = signal<TimePeriods.NoTurn | TimePeriods.HalfTurn>(TimePeriods.NoTurn);

    // Needs to be initialized outside of constructor and after _yourTurn$$.
    // eslint-disable-next-line @typescript-eslint/member-ordering
    public static readonly yourTurn$$: Signal<TimePeriods.NoTurn | TimePeriods.HalfTurn> = TurnService._yourTurn$$.asReadonly();

    public static setYourTurn(yourTurn: TimePeriods.NoTurn | TimePeriods.HalfTurn): void {
        TurnService._yourTurn$$.set(yourTurn);
    }
}
