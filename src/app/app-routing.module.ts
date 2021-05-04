import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CharacterSheetComponent } from './character-sheet/character-sheet.component';

const routes: Routes = [
   { path: '', component: CharacterSheetComponent },
];

@NgModule({
   imports: [
      RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
   ],
   exports: [
      RouterModule
   ],
   declarations: []
})
export class AppRoutingModule { }
