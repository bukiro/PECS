import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';
import { CharacterSheetComponent } from 'src/app/views/character-sheet/character-sheet.component';
import { CharacterSheetModule } from './views/character-sheet/character-sheet.module';

const routes: Routes = [
    { path: '**', component: CharacterSheetComponent },
];

@NgModule({
    imports: [
        CommonModule,
        BrowserModule,
        RouterModule.forRoot(routes),
        CharacterSheetModule,
    ],
    exports: [
        RouterModule,
    ],
    declarations: [],
})
export class AppRoutingModule { }
