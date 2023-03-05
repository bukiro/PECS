import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DescriptionComponent } from './components/description/description.component';
import { QuickdiceModule } from '../../quickdice/quickdice.module';

@NgModule({
    imports: [
        CommonModule,

        QuickdiceModule,
    ],
    declarations: [
        DescriptionComponent,
    ],
    exports: [
        DescriptionComponent,
    ],
})
export class DescriptionModule { }
