import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashComponent } from './components/cash/cash.component';
import { FormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
    ],
    declarations: [
        CashComponent,
    ],
    exports: [
        CashComponent,
    ],
})
export class CashModule { }
