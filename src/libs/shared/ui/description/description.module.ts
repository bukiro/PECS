import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DescriptionComponent } from './components/description/description.component';
import { QuickdiceComponent } from '../../quickdice/components/quickdice/quickdice.component';

@NgModule({
    imports: [
        CommonModule,

        QuickdiceComponent,
    ],
    declarations: [
        DescriptionComponent,
    ],
    exports: [
        DescriptionComponent,
    ],
})
export class DescriptionModule { }
