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
      NewItemPropertyComponent
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
