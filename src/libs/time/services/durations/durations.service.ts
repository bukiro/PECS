/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { TimeService } from 'src/libs/time/services/time/time.service';

@Injectable({
    providedIn: 'root',
})
export class DurationsService {

    constructor(
        private readonly _timeService: TimeService,
    ) { }

    public durationDescription(duration: number, includeTurnState = true, inASentence = false, short = false): string {
        switch (duration) {
            case TimePeriods.UntilRefocus:
                return inASentence
                    ? 'until you refocus'
                    : 'Until you refocus';
            case TimePeriods.UntilRest:
                return inASentence
                    ? 'until the next time you make your daily preparations'
                    : 'Until the next time you make your daily preparations';
            case TimePeriods.Permanent:
                return inASentence
                    ? 'permanently'
                    : 'Permanent';
            case TimePeriods.UntilOtherCharactersTurn:
                return inASentence
                    ? 'until another character\'s turn'
                    : 'Ends on another character\'s turn';
            case TimePeriods.UntilResolved:
            case TimePeriods.UntilResolvedAndOtherCharactersTurn:
                return inASentence
                    ? 'until resolved'
                    : 'Until resolved';
            default: break;
        }

        let returnString = '';
        let workingDuration = duration;
        //Cut off anything that isn't divisible by 5
        const remainder: number = workingDuration % TimePeriods.HalfTurn;

        workingDuration -= remainder;

        if (workingDuration === TimePeriods.HalfTurn) {
            if (this._timeService.yourTurn === TimePeriods.HalfTurn) {
                return inASentence
                    ? 'for rest of turn'
                    : 'Rest of turn';
            }

            if (this._timeService.yourTurn === TimePeriods.NoTurn) {
                return inASentence
                    ? 'until start of next turn'
                    : 'To start of next turn';
            }
        }

        returnString += inASentence ? 'for ' : '';

        if (workingDuration >= TimePeriods.Day) {
            returnString += Math.floor(workingDuration / TimePeriods.Day) + (short ? 'd' : ' day');

            if (!short && workingDuration / TimePeriods.Day > 1) { returnString += 's'; }

            workingDuration %= TimePeriods.Day;
        }

        if (workingDuration >= TimePeriods.Hour) {
            returnString += ` ${ Math.floor(workingDuration / TimePeriods.Hour) }${ short ? 'h' : ' hour' }`;

            if (!short && workingDuration / TimePeriods.Hour > 1) { returnString += 's'; }

            workingDuration %= TimePeriods.Hour;
        }

        if (workingDuration >= TimePeriods.Minute) {
            returnString += ` ${ Math.floor(workingDuration / TimePeriods.Minute) }${ short ? 'm' : ' minute' }`;

            if (!short && workingDuration / TimePeriods.Minute > 1) { returnString += 's'; }

            workingDuration %= TimePeriods.Minute;
        }

        if (workingDuration >= TimePeriods.Turn) {
            returnString += ` ${ Math.floor(workingDuration / TimePeriods.Turn) }${ short ? 't' : ' turn' }`;

            if (!short && workingDuration / TimePeriods.Turn > 1) { returnString += 's'; }

            workingDuration %= TimePeriods.Turn;
        }

        if (includeTurnState && workingDuration === TimePeriods.HalfTurn && this._timeService.yourTurn === TimePeriods.HalfTurn) {
            returnString += ' to end of turn';
        }

        if (includeTurnState && workingDuration === TimePeriods.HalfTurn && this._timeService.yourTurn === TimePeriods.NoTurn) {
            returnString += ' to start of turn';
        }

        if (!returnString || returnString === 'for ') {
            returnString = inASentence
                ? 'for 0 turns'
                : '0 turns';
        }

        if (remainder === 1) {
            returnString += ', then until resolved';
        }

        return returnString.trim();
    }

}
