import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MinimizeButtonComponent } from './components/minimize-button.component';
import { ButtonModule } from '../button/button.module';

@NgModule({
    imports: [
        CommonModule,

        ButtonModule,
    ],
    declarations: [
        MinimizeButtonComponent,
    ],
    exports: [
        MinimizeButtonComponent,
    ],
})
export class MinimizeButtonModule { }
