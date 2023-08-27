import { Injectable } from '@angular/core';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class TurnService {

    //yourTurn is 5 if it is your turn or 0 if not.
    public static yourTurn$: Observable<TimePeriods.NoTurn | TimePeriods.HalfTurn>;

    private static readonly _yourTurn$ = new BehaviorSubject<TimePeriods.NoTurn | TimePeriods.HalfTurn>(TimePeriods.NoTurn);

    constructor() {
        TurnService.yourTurn$ = TurnService._yourTurn$.asObservable();
    }

    public static get yourTurn(): TimePeriods.NoTurn | TimePeriods.HalfTurn {
        return TurnService._yourTurn$.value;
    }

    public static setYourTurn(yourTurn: TimePeriods.NoTurn | TimePeriods.HalfTurn): void {
        //Only used when loading a character
        this._yourTurn$.next(yourTurn);
    }

}
