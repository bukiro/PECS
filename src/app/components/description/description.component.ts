import { Component, Input } from '@angular/core';
import { SpellCasting } from 'src/app/classes/SpellCasting';

@Component({
    selector: 'app-description',
    templateUrl: './description.component.html',
    styleUrls: ['./description.component.scss']
})
export class DescriptionComponent {

    @Input()
    text = '';
    @Input()
    casting: SpellCasting = null;
    @Input()
    oneLiner = false;

    trackByIndex(index: number): number {
        return index;
    }

}
