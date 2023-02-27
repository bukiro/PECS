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

    public static positiveNumbersOnly(event: KeyboardEvent): boolean {
        return positiveNumbersOnly.has(event.key);
    }

    public static bulkOnly(event: InputEvent, currentBulk: string, target?: HTMLInputElement | null): boolean {
        if (!event.data) {
            return true;
        }

        const eventChars = event.data.split('');
        const currentChars = currentBulk.split('');
        const doesInputReplaceAll = target?.selectionStart === 0 && target?.selectionEnd === target?.value.length;

        const doesEventCharsMatchNumbers = eventChars.every(char => positiveNumbersOnly.has(char));
        const doesEventMatchBulk = ['l', 'L'].includes(event.data);
        const doesCurrentCharsMatchNumbers = currentChars.every(char => positiveNumbersOnly.has(char));
        const doesCurrentMatchBulk = ['l', 'L'].includes(currentBulk);

        return (doesEventCharsMatchNumbers !== doesEventMatchBulk)
            && (!currentBulk.length || doesInputReplaceAll ||
                (
                    (doesEventCharsMatchNumbers !== doesCurrentMatchBulk)
                    && (doesEventMatchBulk !== doesCurrentCharsMatchNumbers)
                    && (doesCurrentMatchBulk ? !doesEventMatchBulk : true)
                )
            );
    }

}
