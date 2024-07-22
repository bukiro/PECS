import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CharacterSheetBaseComponent } from '../character-sheet-base/character-sheet-base.component';
import { EffectsComponent } from '../../../../../libs/effects/components/effects/effects.component';
import { InventoryComponent } from '../../../../../libs/inventory/components/inventory/inventory.component';
import { ActivitiesComponent } from '../../../../../libs/activities/components/activities/activities.component';
import { SkillsComponent } from '../../../../../libs/skills/components/skills/skills.component';
import { SpellbookComponent } from '../../../../../libs/spellbook/components/spellbook/spellbook.component';
import { AttacksComponent } from '../../../../../libs/attacks/components/attacks/attacks.component';
import { DefenseComponent } from '../../../../../libs/defense/components/defense/defense.component';
import { HealthComponent } from '../../../../../libs/health/components/health/health.component';
import { AbilitiesComponent } from '../../../../../libs/abilities/components/abilities/abilities.component';
import { GeneralComponent } from '../../../../../libs/general/components/general/general.component';
import { CommonModule } from '@angular/common';
import { ActionIconsComponent } from '../../../../../libs/shared/ui/action-icons/components/action-icons/action-icons.component';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ButtonComponent } from '../../../../../libs/shared/ui/button/components/button/button.component';
import { CharacterSheetCardComponent } from '../../../../../libs/shared/ui/character-sheet-card/character-sheet-card.component';

@Component({
    selector: 'app-character-sheet-mobile',
    templateUrl: './character-sheet-mobile.component.html',
    styleUrls: ['./character-sheet-mobile.component.scss', '../character-sheet-base/character-sheet-base.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

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
