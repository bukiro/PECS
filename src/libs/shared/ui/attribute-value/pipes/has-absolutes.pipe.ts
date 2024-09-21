import { Pipe, PipeTransform } from '@angular/core';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';

@Pipe({
    name: 'hasAbsolutes',
    standalone: true,
})

export class HasAbsolutesPipe implements PipeTransform {
    public transform(bonuses?: Array<BonusDescription>): boolean {
        return !!bonuses?.some(({ isAbsolute }) => isAbsolute);
    }
}
