import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiceIconsD10Component } from './components/diceIcons-D10/diceIcons-D10.component';
import { DiceIconsD12Component } from './components/diceIcons-D12/diceIcons-D12.component';
import { DiceIconsD20Component } from './components/diceIcons-D20/diceIcons-D20.component';
import { DiceIconsD4Component } from './components/diceIcons-D4/diceIcons-D4.component';
import { DiceIconsD6Component } from './components/diceIcons-D6/diceIcons-D6.component';
import { DiceIconsD8Component } from './components/diceIcons-D8/diceIcons-D8.component';

@NgModule({
    imports: [
        CommonModule,
    ],
    declarations: [
        DiceIconsD4Component,
        DiceIconsD6Component,
        DiceIconsD8Component,
        DiceIconsD10Component,
        DiceIconsD12Component,
        DiceIconsD20Component,
    ],
    exports: [
        DiceIconsD4Component,
        DiceIconsD6Component,
        DiceIconsD8Component,
        DiceIconsD10Component,
        DiceIconsD12Component,
        DiceIconsD20Component,
    ],
})
export class DiceIconsModule { }
