import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Routes, RouterModule } from '@angular/router';
import { CharacterSheetComponent } from 'src/app/components/character-sheet/character-sheet.component';

const routes: Routes = [
    { path: '**', component: CharacterSheetComponent },
];

@NgModule({
    imports: [
        CommonModule,
        BrowserModule,
        RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
    ],
    exports: [
        RouterModule,
    ],
    declarations: [],
})
export class AppRoutingModule { }
