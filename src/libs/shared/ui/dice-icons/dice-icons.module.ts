import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiceIconD10Component } from './components/dice-icon-D10/dice-icon-D10.component';
import { DiceIconD12Component } from './components/dice-icon-D12/dice-icon-D12.component';
import { DiceIconD20Component } from './components/dice-icon-D20/dice-icon-D20.component';
import { DiceIconD4Component } from './components/dice-icon-D4/dice-icon-D4.component';
import { DiceIconD6Component } from './components/dice-icon-D6/dice-icon-D6.component';
import { DiceIconD8Component } from './components/dice-icon-D8/dice-icon-D8.component';

@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        DiceIconD4Component,
        DiceIconD6Component,
        DiceIconD8Component,
        DiceIconD10Component,
        DiceIconD12Component,
        DiceIconD20Component,
    ],
    exports: [
        DiceIconD4Component,
        DiceIconD6Component,
        DiceIconD8Component,
        DiceIconD10Component,
        DiceIconD12Component,
        DiceIconD20Component,
    ],
})
export class DiceIconsModule { }
