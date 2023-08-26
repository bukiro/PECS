import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { appFeature } from './app.feature';

@NgModule({
    imports: [
        StoreModule.forFeature(appFeature),
    ],
})
export class AppStoreModule { }
