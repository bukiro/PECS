import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from 'src/app/app.component';
import { AbilitiesComponent } from 'src/app/components/abilities/abilities.component';
import { TopBarComponent } from 'src/app/components/top-bar/top-bar.component';
import { SkillsComponent } from 'src/app/components/skills/skills.component';
import { ItemsComponent } from 'src/app/components/items/items.component';
import { CharacterSheetComponent } from 'src/app/components/character-sheet/character-sheet.component';
import { InventoryComponent } from 'src/app/components/inventory/inventory.component';
import { CharacterComponent } from 'src/app/components/character/character.component';
import { AttacksComponent } from 'src/app/components/attacks/attacks.component';
import { EffectsComponent } from 'src/app/components/effects/effects.component';
import { DefenseComponent } from 'src/app/components/defense/defense.component';
import { ProficiencyFormComponent } from 'src/app/components/proficiency-form/proficiency-form.component';
import { SkillComponent } from 'src/app/components/skill/skill.component';
import { HealthComponent } from 'src/app/components/health/health.component';
import { GeneralComponent } from 'src/app/components/general/general.component';
import { ActivitiesComponent } from 'src/app/components/activities/activities.component';
import { SpellsComponent } from 'src/app/components/spells/spells.component';
import { SpellbookComponent } from 'src/app/components/spellbook/spellbook.component';
import { ConditionsComponent } from 'src/app/components/conditions/conditions.component';
import { TimeComponent } from 'src/app/components/time/time.component';
import { ActivityComponent } from 'src/app/components/activity/activity.component';
import { ItemComponent } from 'src/app/components/item/item.component';
import { SpellComponent } from 'src/app/components/spell/spell.component';
import { TagsComponent } from 'src/app/components/tags/tags.component';
import { NewItemPropertyComponent } from 'src/app/components/items/newItemProperty/newItemProperty.component';
import { ItemRunesComponent } from 'src/app/components/item/itemRunes/itemRunes.component';
import { AnimalCompanionComponent } from 'src/app/components/animal-companion/animal-companion.component';
import { SpellchoiceComponent } from 'src/app/components/spells/spellchoice/spellchoice.component';
import { FamiliarComponent } from 'src/app/components/familiar/familiar.component';
import { FeatchoiceComponent } from 'src/app/components/character/featchoice/featchoice.component';
import { FamiliarabilitiesComponent } from 'src/app/components/familiar/familiarabilities/familiarabilities.component';
import { ItemOilsComponent } from 'src/app/components/item/itemOils/itemOils.component';
import { ItemAeonStonesComponent } from 'src/app/components/item/itemAeonStones/itemAeonStones.component';
import { ActionIconsComponent } from 'src/app/components/actionIcons/actionIcons.component';
import { FeatComponent } from 'src/app/components/character/feat/feat.component';
import { SpellLibraryComponent } from 'src/app/components/spellLibrary/spellLibrary.component';
import { ItemTalismansComponent } from 'src/app/components/item/itemTalismans/itemTalismans.component';
import { CraftingComponent } from 'src/app/components/crafting/crafting.component';
import { ItemMaterialComponent } from 'src/app/components/item/itemMaterial/itemMaterial.component';
import { ItemPoisonsComponent } from 'src/app/components/item/itemPoisons/itemPoisons.component';
import { DiceComponent } from 'src/app/components/dice/dice.component';
import { DiceIconsD4Component } from 'src/app/components/dice/diceIcons-D4/diceIcons-D4.component';
import { DiceIconsD6Component } from 'src/app/components/dice/diceIcons-D6/diceIcons-D6.component';
import { DiceIconsD8Component } from 'src/app/components/dice/diceIcons-D8/diceIcons-D8.component';
import { DiceIconsD10Component } from 'src/app/components/dice/diceIcons-D10/diceIcons-D10.component';
import { DiceIconsD12Component } from 'src/app/components/dice/diceIcons-D12/diceIcons-D12.component';
import { DiceIconsD20Component } from 'src/app/components/dice/diceIcons-D20/diceIcons-D20.component';
import { SkillchoiceComponent } from 'src/app/components/character/skillchoice/skillchoice.component';
import { ItemBladeAllyComponent } from 'src/app/components/item/itemBladeAlly/itemBladeAlly.component';
import { HintComponent } from 'src/app/components/tags/hint/hint.component';
import { ConditionComponent } from 'src/app/components/effects/condition/condition.component';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { GridIconComponent } from 'src/app/components/gridIcon/gridIcon.component';
import { QuickdiceComponent } from 'src/app/components/dice/quickdice/quickdice.component';
import { LicensesComponent } from 'src/app/components/character/licenses/licenses.component';
import { ToastContainerComponent } from 'src/app/components/toast-container/toast-container.component';
import { SpellTargetComponent } from 'src/app/components/spellTarget/spellTarget.component';
import { StickyPopoverDirective } from 'src/app/directives/StickyPopover.directive';
import { ObjectEffectsComponent } from 'src/app/components/objectEffects/objectEffects.component';
import { DescriptionComponent } from 'src/app/components/description/description.component';
import { ItemTargetComponent } from 'src/app/components/itemTarget/itemTarget.component';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ItemTalismanCordsComponent } from 'src/app/components/item/itemTalismanCords/itemTalismanCords.component';
import { ActivityContentComponent } from 'src/app/components/activity/activityContent/activityContent.component';
import { ItemContentComponent } from 'src/app/components/item/itemContent/itemContent.component';
import { HintItemComponent } from 'src/app/components/tags/hint/hintItem/hintItem.component';
import { SpellContentComponent } from 'src/app/components/spell/spellContent/spellContent.component';
import { ItemEmblazonArmamentComponent } from 'src/app/components/item/itemEmblazonArmament/itemEmblazonArmament.component';
import { TraitComponent } from 'src/app/components/trait/trait.component';
import { AboutComponent } from 'src/app/components/character/about/about.component';
import { AppInitService } from './core/services/app-init/app-init.service';
import { ItemMaterialArmorComponent } from './components/item/itemMaterialOptions/itemMaterialArmor.component';
import { ItemMaterialShieldComponent } from './components/item/itemMaterialOptions/itemMaterialShield.component';
import { ItemMaterialWeaponComponent } from './components/item/itemMaterialOptions/itemMaterialWeapon.component';
import { CashComponent } from './components/cash/cash.component';

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
        DiceIconsD4Component,
        DiceIconsD6Component,
        DiceIconsD8Component,
        DiceIconsD10Component,
        DiceIconsD12Component,
        DiceIconsD20Component,
        SkillchoiceComponent,
        ItemBladeAllyComponent,
        ConditionComponent,
        GridIconComponent,
        QuickdiceComponent,
        LicensesComponent,
        ToastContainerComponent,
        SpellTargetComponent,
        StickyPopoverDirective,
        ObjectEffectsComponent,
        DescriptionComponent,
        ItemTargetComponent,
        ItemTalismanCordsComponent,
        HintComponent,
        TagsComponent,
        ActivityContentComponent,
        ItemContentComponent,
        HintItemComponent,
        SpellContentComponent,
        ItemEmblazonArmamentComponent,
        TraitComponent,
        AboutComponent,
        ItemMaterialArmorComponent,
        ItemMaterialShieldComponent,
        ItemMaterialWeaponComponent,
        CashComponent,
    ],
    imports: [
        CommonModule,
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        AppRoutingModule,
        HttpClientModule,
        NgbModule,
        DragDropModule,
    ],
    providers: [
        NgbActiveModal,
        { provide: APP_INITIALIZER, useFactory: (service: AppInitService) => () => service, deps: [AppInitService], multi: true },
    ],
    bootstrap: [
        AppComponent,
    ],
})
export class AppModule { }
