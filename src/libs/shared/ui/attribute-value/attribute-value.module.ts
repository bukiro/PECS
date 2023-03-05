import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { BonusListModule } from '../bonus-list/bonus-list.module';
import { ObjectEffectsModule } from '../../object-effects/object-effects.module';
import { QuickdiceModule } from '../../quickdice/quickdice.module';
import { AttributeValueComponent } from './components/attribute-value/attribute-value.component';

@NgModule({
    imports: [
        CommonModule,
        NgbPopoverModule,
        NgbTooltipModule,
        ObjectEffectsModule,
        QuickdiceModule,
        BonusListModule,
    ],
    declarations: [
        AttributeValueComponent,
    ],
    exports: [
        AttributeValueComponent,
    ],
})
export class AttributeValueModule { }
