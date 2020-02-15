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
import { LevelComponent } from './level/level.component';
import { AttacksComponent } from './attacks/attacks.component';
import { EffectsComponent } from './effects/effects.component';
import { DefenseComponent } from './defense/defense.component';

import { SortByPipe } from './sortBy.pipe';
import { ProficiencyFormComponent } from './proficiency-form/proficiency-form.component';


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
      LevelComponent,
      AttacksComponent,
      EffectsComponent,
      DefenseComponent,
      ProficiencyFormComponent
   ],
   imports: [
      BrowserModule,
      BrowserAnimationsModule,
      FormsModule,
      ReactiveFormsModule,
      AppRoutingModule,
      HttpClientModule
   ],
   providers: [],
   bootstrap: [
      AppComponent
   ]
})
export class AppModule { }
