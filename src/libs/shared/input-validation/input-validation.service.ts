import { Injectable } from '@angular/core';

const positiveNumbersOnly = new Set([
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '0',
]);

const bulkOnly = new Set([
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '0',
    'L',
]);

@Injectable({
    providedIn: 'root',
})
export class InputValidationService {

    public static positiveNumbersOnly(event: KeyboardEvent): boolean {
        return positiveNumbersOnly.has(event.key);
    }

    //TO-DO: Verify that this still works after changing to event.key from event.keyCode.
    public static bulkOnly(event: KeyboardEvent): boolean {
        return bulkOnly.has(event.key);
    }

}
