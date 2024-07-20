import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CharacterSheetComponent } from './character-sheet.component';
import { DiceModule } from 'src/app/views/dice/dice.module';
import { EffectsModule } from 'src/libs/effects/effects.module';
import { HealthModule } from 'src/libs/health/health.module';
import { ActionIconsModule } from 'src/libs/shared/ui/action-icons/action-icons.module';
import { ItemsModule } from '../items/items.module';
import { CraftingModule } from '../crafting/crafting.module';
import { SpellLibraryModule } from '../spell-library/spell-library.module';
import { ConditionsModule } from '../conditions/conditions.module';
import { SpellSelectionModule } from '../spell-selection/spell-selection.module';
import { GeneralModule } from 'src/libs/general/general.module';
import { SkillsModule } from 'src/libs/skills/skills.module';
import { DefenseModule } from 'src/libs/defense/defense.module';
import { InventoryModule } from 'src/libs/inventory/inventory.module';
import { FamiliarModule } from '../familiar/familiar.module';
import { AbilitiesModule } from 'src/libs/abilities/abilities.module';
import { AnimalCompanionModule } from '../animal-companion/animal-companion.module';
import { CharacterCreationModule } from '../character-creation/character-creation.module';
import { AttacksModule } from 'src/libs/attacks/attacks.module';
import { SpellbookModule } from 'src/libs/spellbook/spellbook.module';
import { CharacterSheetDesktopComponent } from './components/character-sheet-desktop/character-sheet-desktop.component';
import { CharacterSheetMobileComponent } from './components/character-sheet-mobile/character-sheet-mobile.component';
import { ActivitiesModule } from 'src/libs/activities/activities.module';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { CharacterSheetCardComponent } from 'src/libs/shared/ui/character-sheet-card/character-sheet-card.component';
import { LoadingDiamondComponent } from 'src/libs/shared/ui/diamond/components/loading-diamond/loading-diamond.component';

@NgModule({
    imports: [
        CommonModule,

        NgbTooltipModule,

        DiceModule,
        EffectsModule,
        HealthModule,
        ActionIconsModule,
        ItemsModule,
        CraftingModule,
        SpellLibraryModule,
        ConditionsModule,
        SpellSelectionModule,
        GeneralModule,
        SkillsModule,
        DefenseModule,
        InventoryModule,
        FamiliarModule,
        AbilitiesModule,
        AnimalCompanionModule,
        CharacterCreationModule,
        AttacksModule,
        SpellbookModule,
        ActivitiesModule,
        ButtonComponent,
        CharacterSheetCardComponent,
        LoadingDiamondComponent,
    ],
    declarations: [
        CharacterSheetComponent,
        CharacterSheetDesktopComponent,
        CharacterSheetMobileComponent,
    ],
    exports: [
        CharacterSheetComponent,
    ],
})
export class CharacterSheetModule { }
