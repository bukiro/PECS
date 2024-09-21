import { Pipe, PipeTransform } from '@angular/core';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';

@Pipe({
    name: 'hasBonuses',
    standalone: true,
})

export class HasBonusesPipe implements PipeTransform {
    public transform(bonuses?: Array<BonusDescription>): boolean {
        return !!bonuses?.some(({ isBonus }) => isBonus);
    }
}
