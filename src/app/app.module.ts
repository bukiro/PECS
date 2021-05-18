import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';

import { AbilitiesComponent } from './abilities/abilities.component';
import { TopBarComponent } from './top-bar/top-bar.component';
import { SkillsComponent } from './skills/skills.component';
import { ItemsComponent } from './items/items.component';
import { CharacterSheetComponent } from './character-sheet/character-sheet.component';
import { InventoryComponent } from './inventory/inventory.component';
import { CharacterComponent } from './character/character.component';
import { AttacksComponent } from './attacks/attacks.component';
import { EffectsComponent } from './effects/effects.component';
import { DefenseComponent } from './defense/defense.component';
import { ProficiencyFormComponent } from './proficiency-form/proficiency-form.component';
import { SkillComponent } from './skill/skill.component';
import { HealthComponent } from './health/health.component';
import { GeneralComponent } from './general/general.component';
import { ActivitiesComponent } from './activities/activities.component';
import { SpellsComponent } from './spells/spells.component';
import { SpellbookComponent } from './spellbook/spellbook.component';
import { ConditionsComponent } from './conditions/conditions.component';
import { TimeComponent } from './time/time.component';
import { ActivityComponent } from './activity/activity.component';
import { ItemComponent } from './item/item.component';
import { SpellComponent } from './spell/spell.component';
import { TagsComponent } from './tags/tags.component';
import { NewItemPropertyComponent } from './items/newItemProperty/newItemProperty.component';
import { ItemRunesComponent } from './item/itemRunes/itemRunes.component';
import { AnimalCompanionComponent } from './animal-companion/animal-companion.component';
import { SpellchoiceComponent } from './spells/spellchoice/spellchoice.component';
import { FamiliarComponent } from './familiar/familiar.component';
import { FeatchoiceComponent } from './character/featchoice/featchoice.component';
import { FamiliarabilitiesComponent } from './familiar/familiarabilities/familiarabilities.component';
import { ItemOilsComponent } from './item/itemOils/itemOils.component';
import { ItemAeonStonesComponent } from './item/itemAeonStones/itemAeonStones.component';
import { ActionIconsComponent } from './actionIcons/actionIcons.component';
import { FeatComponent } from './character/feat/feat.component';
import { SpellLibraryComponent } from './spellLibrary/spellLibrary.component';
import { ItemTalismansComponent } from './item/itemTalismans/itemTalismans.component';
import { CraftingComponent } from './crafting/crafting.component';
import { ItemMaterialComponent } from './item/itemMaterial/itemMaterial.component';
import { ItemPoisonsComponent } from './item/itemPoisons/itemPoisons.component';
import { DiceComponent } from './dice/dice.component';
import { DiceIcons_D4Component } from './dice/diceIcons_D4/diceIcons_D4.component';
import { DiceIcons_D6Component } from './dice/diceIcons_D6/diceIcons_D6.component';
import { DiceIcons_D8Component } from './dice/diceIcons_D8/diceIcons_D8.component';
import { DiceIcons_D10Component } from './dice/diceIcons_D10/diceIcons_D10.component';
import { DiceIcons_D12Component } from './dice/diceIcons_D12/diceIcons_D12.component';
import { DiceIcons_D20Component } from './dice/diceIcons_D20/diceIcons_D20.component';
import { SkillchoiceComponent } from './character/skillchoice/skillchoice.component';
import { ItemBladeAllyComponent } from './item/itemBladeAlly/itemBladeAlly.component';
import { HintComponent } from './tags/hint/hint.component';
import { ConditionComponent } from './effects/condition/condition.component';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { GridIconComponent } from './gridIcon/gridIcon.component';
import { QuickdiceComponent } from './dice/quickdice/quickdice.component';
import { LicensesComponent } from './character/licenses/licenses.component';
import { ToastContainerComponent } from './toast-container/toast-container.component';
import { SpellTargetComponent } from './spellTarget/spellTarget.component';
import { StickyPopoverDirective } from './StickyPopover.directive';
import { ObjectEffectsComponent } from './objectEffects/objectEffects.component';
import { DescriptionComponent } from './description/description.component';

@NgModule({
   declarations: [				 
      AppComponent,
      AbilitiesComponent,
      TopBarComponent,
      SkillsComponent,
      ItemsComponent,
      CharacterSheetComponent,
      InventoryComponent,
      CharacterComponent,
      AttacksComponent,
      EffectsComponent,
      DefenseComponent,
      ProficiencyFormComponent,
      SkillComponent,
      HealthComponent,
      GeneralComponent,
      ActivitiesComponent,
      SpellsComponent,
      SpellbookComponent,
      ConditionsComponent,
      TimeComponent,
      ActivityComponent,
      ItemComponent,
      SpellComponent,
      TagsComponent,
      NewItemPropertyComponent,
      ItemRunesComponent,
      AnimalCompanionComponent,
      SpellchoiceComponent,
      FamiliarComponent,
      FeatchoiceComponent,
      FamiliarabilitiesComponent,
      ItemOilsComponent,
      ItemAeonStonesComponent,
      ActionIconsComponent,
      FeatComponent,
      SpellLibraryComponent,
      ItemTalismansComponent,
      CraftingComponent,
      ItemMaterialComponent,
      ItemPoisonsComponent,
      DiceComponent,
      DiceIcons_D4Component,
      DiceIcons_D6Component,
      DiceIcons_D8Component,
      DiceIcons_D10Component,
      DiceIcons_D12Component,
      DiceIcons_D20Component,
      SkillchoiceComponent,
      ItemBladeAllyComponent,
      HintComponent,
      ConditionComponent,
      GridIconComponent,
      QuickdiceComponent,
      LicensesComponent,
      ToastContainerComponent,
      SpellTargetComponent,
      StickyPopoverDirective,
      ObjectEffectsComponent,
      DescriptionComponent
   ],
   imports: [
      BrowserModule,
      BrowserAnimationsModule,
      FormsModule,
      ReactiveFormsModule,
      AppRoutingModule,
      HttpClientModule,
      NgbModule
   ],
   providers: [
      NgbActiveModal
   ],
   bootstrap: [
      AppComponent
   ]
})
export class AppModule { }
