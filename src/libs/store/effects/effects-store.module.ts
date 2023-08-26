import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { effectsFeature } from './effects.feature';

@NgModule({
    imports: [
        StoreModule.forFeature(effectsFeature),
    ],
})
export class EffectsStoreModule { }
