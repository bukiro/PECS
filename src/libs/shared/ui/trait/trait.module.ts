import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraitComponent } from './components/trait/trait.component';
import { DescriptionModule } from '../description/description.module';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbPopoverModule,
        NgbTooltipModule,

        DescriptionModule,
    ],
    declarations: [
        TraitComponent,
    ],
    exports: [
        TraitComponent,
    ],
})
export class TraitModule { }
