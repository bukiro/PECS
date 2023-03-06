import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CharacterSheetBaseComponent } from '../character-sheet-base/character-sheet-base.component';

@Component({
    selector: 'app-character-sheet-desktop',
    templateUrl: './character-sheet-desktop.component.html',
    styleUrls: ['./character-sheet-desktop.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSheetDesktopComponent extends CharacterSheetBaseComponent {

    public showInColumn: Array<Record<string, Array<string>>>;

    constructor() {
        super();

        this.showInColumn = [
            {
                All: [
                    'general_upper',
                    'health',
                    'abilities',
                    'skills',
                    'activities',
                ],
                Encounter: [
                    'defense',
                    'health',
                    'general_lower',
                    'abilities',
                    'skills',
                    'activities',
                ],
                Exploration: [
                    'general_upper',
                    'health',
                    'abilities',
                ],
                Downtime: [
                    'general_upper',
                    'health',
                    'abilities',
                    'spellbook_lower',
                ],
                Inventory: [
                    'inventory',
                ],
            },
            {
                All: [
                    'defense',
                    'attacks',
                    'spellbook_upper',
                    'inventory',
                ],
                Encounter: [
                    'attacks',
                    'spellbook_upper',
                ],
                Exploration: [
                    'skills',
                    'spellbook_lower',
                ],
                Downtime: [
                    'skills',
                    'activities',
                ],
                Inventory: [
                    'defense',
                    'attacks',
                    'activities',
                ],
            },
        ];
    }

}
