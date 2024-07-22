import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CharacterSheetBaseComponent } from '../character-sheet-base/character-sheet-base.component';
import { InventoryComponent } from 'src/libs/inventory/components/inventory/inventory.component';
import { ActivitiesComponent } from 'src/libs/activities/components/activities/activities.component';
import { SkillsComponent } from 'src/libs/skills/components/skills/skills.component';
import { AbilitiesComponent } from 'src/libs/abilities/components/abilities/abilities.component';
import { HealthComponent } from 'src/libs/health/components/health/health.component';
import { SpellbookComponent } from 'src/libs/spellbook/components/spellbook/spellbook.component';
import { AttacksComponent } from 'src/libs/attacks/components/attacks/attacks.component';
import { DefenseComponent } from 'src/libs/defense/components/defense/defense.component';
import { GeneralComponent } from 'src/libs/general/components/general/general.component';
import { EffectsComponent } from 'src/libs/effects/components/effects/effects.component';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';
import { CharacterSheetCardComponent } from 'src/libs/shared/ui/character-sheet-card/character-sheet-card.component';

@Component({
    selector: 'app-character-sheet-desktop',
    templateUrl: './character-sheet-desktop.component.html',
    styleUrls: ['./character-sheet-desktop.component.scss', '../character-sheet-base/character-sheet-base.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CharacterSheetCardComponent,
        ButtonComponent,
        EffectsComponent,
        GeneralComponent,
        DefenseComponent,
        AttacksComponent,
        SpellbookComponent,
        HealthComponent,
        AbilitiesComponent,
        SkillsComponent,
        ActivitiesComponent,
        InventoryComponent,
    ],
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
