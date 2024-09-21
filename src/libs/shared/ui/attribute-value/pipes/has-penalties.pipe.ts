import { Pipe, PipeTransform } from '@angular/core';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';

@Pipe({
    name: 'hasPenalties',
    standalone: true,
})

export class HasPenaltiesPipe implements PipeTransform {
    public transform(bonuses?: Array<BonusDescription>): boolean {
        return !!bonuses?.some(({ isPenalty }) => isPenalty);
    }
}
