import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GeneralComponent } from './components/general/general.component';
import { TraitModule } from '../shared/ui/trait/trait.module';
import { TagsModule } from '../shared/tags/tags.module';
import { NgbPopoverModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    imports: [
        CommonModule,

        NgbPopoverModule,
        NgbTooltipModule,

        TraitModule,
        TagsModule,
    ],
    declarations: [
        GeneralComponent,
    ],
    exports: [
        GeneralComponent,
    ],
})
export class GeneralModule { }
