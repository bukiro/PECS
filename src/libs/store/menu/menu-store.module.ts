import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { menuFeature } from './menu.feature';

@NgModule({
    imports: [
        StoreModule.forFeature(menuFeature),
    ],
})
export class MenuStoreModule { }
