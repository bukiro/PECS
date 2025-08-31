import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CharacterSheetBaseComponent } from '../character-sheet-base/character-sheet-base.component';
import { ActionIconsComponent } from 'src/libs/shared/ui/action-icons/components/action-icons/action-icons.component';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';
import { CharacterSheetCardComponent } from 'src/libs/shared/ui/character-sheet-card/character-sheet-card.component';

type Modes =
    'All' |
    'Health' |
    'Defense' |
    'Activities' |
    'Attacks' |
    'Spells' |
    'Skills' |
    'Inventory' |
    'ConditionsEffects';

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
        // GeneralComponent,
        // AbilitiesComponent,
        // HealthComponent,
        // DefenseComponent,
        // AttacksComponent,
        // SpellbookComponent,
        // SkillsComponent,
        // ActivitiesComponent,
        // InventoryComponent,
        // EffectsComponent,
    ],
})
export class CharacterSheetMobileComponent extends CharacterSheetBaseComponent<Modes> { }
