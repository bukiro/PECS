import { Injectable } from '@angular/core';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class TurnService {
    private static readonly _yourTurnSubject$ = new BehaviorSubject<TimePeriods.NoTurn | TimePeriods.HalfTurn>(TimePeriods.NoTurn);
    private static _yourTurn$?: Observable<TimePeriods.NoTurn | TimePeriods.HalfTurn>;

    //yourTurn is 5 if it is your turn or 0 if not.
    public static get yourTurn$(): Observable<TimePeriods.NoTurn | TimePeriods.HalfTurn> {
        if (!TurnService._yourTurn$) {
            TurnService._yourTurn$ = TurnService._yourTurnSubject$.asObservable();
        }

        return TurnService._yourTurn$;
    }

    public static get yourTurn(): TimePeriods.NoTurn | TimePeriods.HalfTurn {
        return TurnService._yourTurnSubject$.value;
    }

    public static setYourTurn(yourTurn: TimePeriods.NoTurn | TimePeriods.HalfTurn): void {
        //Only used when loading a character
        TurnService._yourTurnSubject$.next(yourTurn);
    }
}
