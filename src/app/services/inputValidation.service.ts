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

@Injectable({
    providedIn: 'root',
})
export class InputValidationService {

    public static positiveNumbersOnly(event: KeyboardEvent) {
        return positiveNumbersOnly.has(event.key);
    }

}
