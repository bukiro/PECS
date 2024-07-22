import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CharacterSheetBaseComponent } from '../character-sheet-base/character-sheet-base.component';
import { EffectsComponent } from 'src/libs/effects/components/effects/effects.component';
import { InventoryComponent } from 'src/libs/inventory/components/inventory/inventory.component';
import { ActivitiesComponent } from 'src/libs/activities/components/activities/activities.component';
import { SkillsComponent } from 'src/libs/skills/components/skills/skills.component';
import { SpellbookComponent } from 'src/libs/spellbook/components/spellbook/spellbook.component';
import { AttacksComponent } from 'src/libs/attacks/components/attacks/attacks.component';
import { DefenseComponent } from 'src/libs/defense/components/defense/defense.component';
import { HealthComponent } from 'src/libs/health/components/health/health.component';
import { AbilitiesComponent } from 'src/libs/abilities/components/abilities/abilities.component';
import { GeneralComponent } from 'src/libs/general/components/general/general.component';
import { ActionIconsComponent } from 'src/libs/shared/ui/action-icons/components/action-icons/action-icons.component';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';
import { CharacterSheetCardComponent } from 'src/libs/shared/ui/character-sheet-card/character-sheet-card.component';

@Component({
    selector: 'app-character-sheet-mobile',
    templateUrl: './character-sheet-mobile.component.html',
    styleUrls: ['./character-sheet-mobile.component.scss', '../character-sheet-base/character-sheet-base.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgbTooltip,
        CharacterSheetCardComponent,
        ButtonComponent,
        ActionIconsComponent,
        GeneralComponent,
        AbilitiesComponent,
        HealthComponent,
        DefenseComponent,
        AttacksComponent,
        SpellbookComponent,
        SkillsComponent,
        ActivitiesComponent,
        InventoryComponent,
        EffectsComponent,
    ],
})
export class CharacterSheetMobileComponent extends CharacterSheetBaseComponent {

    constructor() {
        super();
    }

}
