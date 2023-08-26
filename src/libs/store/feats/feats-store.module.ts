import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { featsFeature } from './feats.feature';

@NgModule({
    imports: [
        StoreModule.forFeature(featsFeature),
    ],
})
export class FeatsStoreModule { }
