import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CharacterSheetBaseComponent } from '../character-sheet-base/character-sheet-base.component';
import { InventoryComponent } from '../../../../../libs/inventory/components/inventory/inventory.component';
import { ActivitiesComponent } from '../../../../../libs/activities/components/activities/activities.component';
import { SkillsComponent } from '../../../../../libs/skills/components/skills/skills.component';
import { AbilitiesComponent } from '../../../../../libs/abilities/components/abilities/abilities.component';
import { HealthComponent } from '../../../../../libs/health/components/health/health.component';
import { SpellbookComponent } from '../../../../../libs/spellbook/components/spellbook/spellbook.component';
import { AttacksComponent } from '../../../../../libs/attacks/components/attacks/attacks.component';
import { DefenseComponent } from '../../../../../libs/defense/components/defense/defense.component';
import { GeneralComponent } from '../../../../../libs/general/components/general/general.component';
import { EffectsComponent } from '../../../../../libs/effects/components/effects/effects.component';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../../libs/shared/ui/button/components/button/button.component';
import { CharacterSheetCardComponent } from '../../../../../libs/shared/ui/character-sheet-card/character-sheet-card.component';

@Component({
    selector: 'app-character-sheet-desktop',
    templateUrl: './character-sheet-desktop.component.html',
    styleUrls: ['./character-sheet-desktop.component.scss', '../character-sheet-base/character-sheet-base.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

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
