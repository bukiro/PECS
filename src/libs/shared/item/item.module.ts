import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemComponent } from './components/item/item.component';
import { ItemAeonStonesComponent } from './components/item-aeon-stones/item-aeon-stones.component';
import { ItemBladeAllyComponent } from './components/item-blade-ally/item-blade-ally.component';
import { ItemEmblazonArmamentComponent } from './components/item-emblazon-armament/item-emblazon-armament.component';
import { ItemMaterialComponent } from './components/item-material/item-material.component';
import { ItemMaterialArmorComponent } from './components/item-material-options/item-material-armor.component';
import { ItemMaterialShieldComponent } from './components/item-material-options/item-material-shield.component';
import { ItemMaterialWeaponComponent } from './components/item-material-options/item-material-weapon.component';
import { ItemOilsComponent } from './components/item-oils/item-oils.component';
import { ItemPoisonsComponent } from './components/item-poisons/item-poisons.component';
import { ItemRunesComponent } from './components/item-runes/item-runes.component';
import { ItemTalismanCordsComponent } from './components/item-talisman-cords/item-talisman-cords.component';
import { ItemTalismansComponent } from './components/item-talismans/item-talismans.component';
import { FormsModule } from '@angular/forms';
import { ActionIconsModule } from '../ui/action-icons/action-icons.module';
import { ActivityModule } from '../activity/activity.module';
import { TagsModule } from '../tags/tags.module';
import { TraitModule } from '../ui/trait/trait.module';
import { SpellModule } from '../spell/spell.module';
import { DescriptionModule } from '../ui/description/description.module';
import { QuickdiceModule } from '../quickdice/quickdice.module';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { SpellChoiceModule } from '../spell-choice/spell-choice.module';
import { ItemContentModule } from '../item-content/item-content.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbPopoverModule,

        ActionIconsModule,
        ActivityModule,
        TagsModule,
        TraitModule,
        SpellModule,
        DescriptionModule,
        SpellChoiceModule,
        QuickdiceModule,
        ItemContentModule,
    ],
    declarations: [
        ItemComponent,
        ItemAeonStonesComponent,
        ItemBladeAllyComponent,
        ItemEmblazonArmamentComponent,
        ItemMaterialComponent,
        ItemMaterialArmorComponent,
        ItemMaterialShieldComponent,
        ItemMaterialWeaponComponent,
        ItemOilsComponent,
        ItemPoisonsComponent,
        ItemRunesComponent,
        ItemTalismanCordsComponent,
        ItemTalismansComponent,
    ],
    exports: [
        ItemComponent,
        ItemAeonStonesComponent,
        ItemBladeAllyComponent,
        ItemEmblazonArmamentComponent,
        ItemMaterialComponent,
        ItemOilsComponent,
        ItemPoisonsComponent,
        ItemRunesComponent,
        ItemTalismanCordsComponent,
        ItemTalismansComponent,
    ],
})
export class ItemModule { }
