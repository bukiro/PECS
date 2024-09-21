import { Pipe, PipeTransform } from '@angular/core';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';

@Pipe({
    name: 'bonusesClass',
    standalone: true,
})

export class BonusesClassPipe implements PipeTransform {
    public transform(bonuses?: Array<BonusDescription>): 'absolute' | 'bonus' | 'penalty' | '' {
        if (bonuses?.some(({ isAbsolute }) => isAbsolute)) {
            return 'absolute';
        }

        if (bonuses?.some(({ isPenalty }) => isPenalty)) {
            return 'penalty';
        }

        if (bonuses?.some(({ isBonus }) => isBonus)) {
            return 'bonus';
        }

        return '';
    }
}
