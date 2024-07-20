import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryComponent } from './components/inventory/inventory.component';
import { NgbCollapseModule, NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { TagsModule } from '../shared/tags/tags.module';
import { ObjectEffectsModule } from '../shared/object-effects/object-effects.module';
import { ActionIconsModule } from '../shared/ui/action-icons/action-icons.module';
import { ItemModule } from '../shared/item/item.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SpelltargetModule } from '../shared/spell-target/spell-target.module';
import { ItemTargetModule } from '../shared/item-target/item-target.module';
import { FormsModule } from '@angular/forms';
import { StickyPopoverModule } from '../shared/sticky-popover/sticky-popover.module';
import { GridIconModule } from '../shared/ui/grid-icon/grid-icon.module';
import { CharacterSheetCardComponent } from '../shared/ui/character-sheet-card/character-sheet-card.component';
import { ButtonComponent } from '../shared/ui/button/components/button/button.component';
import { AttributeValueComponent } from '../shared/ui/attribute-value/components/attribute-value/attribute-value.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,
        NgbCollapseModule,
        DragDropModule,

        TagsModule,
        ObjectEffectsModule,
        ActionIconsModule,
        ItemModule,
        SpelltargetModule,
        ItemTargetModule,
        StickyPopoverModule,
        GridIconModule,
        ButtonComponent,
        AttributeValueComponent,
        CharacterSheetCardComponent,
    ],
    declarations: [
        InventoryComponent,
    ],
    exports: [
        InventoryComponent,
    ],
})
export class InventoryModule { }
