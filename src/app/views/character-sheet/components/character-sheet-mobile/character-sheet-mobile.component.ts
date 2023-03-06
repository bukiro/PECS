import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CharacterSheetBaseComponent } from '../character-sheet-base/character-sheet-base.component';

@Component({
    selector: 'app-character-sheet-mobile',
    templateUrl: './character-sheet-mobile.component.html',
    styleUrls: ['./character-sheet-mobile.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSheetMobileComponent extends CharacterSheetBaseComponent {

    constructor() {
        super();
    }

}
