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
import { SortByPipe } from './sortBy.pipe';
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
import { ActionIcons_1AComponent } from './actionIcons/actionIcons_1A/actionIcons_1A.component';
import { ActionIcons_2AComponent } from './actionIcons/actionIcons_2A/actionIcons_2A.component';
import { ActionIcons_3AComponent } from './actionIcons/actionIcons_3A/actionIcons_3A.component';
import { ActionIcons_FreeComponent } from './actionIcons/actionIcons_Free/actionIcons_Free.component';
import { ActionIcons_ReactionComponent } from './actionIcons/actionIcons_Reaction/actionIcons_Reaction.component';
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

@NgModule({
   declarations: [
      AppComponent,
      AbilitiesComponent,
      TopBarComponent,
      SkillsComponent,
      SortByPipe,
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
      ActionIcons_1AComponent,
      ActionIcons_2AComponent,
      ActionIcons_3AComponent,
      ActionIcons_FreeComponent,
      ActionIcons_ReactionComponent,
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
      DiceIcons_D20Component
   ],
   imports: [
      BrowserModule,
      BrowserAnimationsModule,
      FormsModule,
      ReactiveFormsModule,
      AppRoutingModule,
      HttpClientModule
   ],
   providers: [
      SortByPipe
   ],
   bootstrap: [
      AppComponent
   ]
})
export class AppModule { }
