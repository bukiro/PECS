import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { statusFeature } from './status.feature';

@NgModule({
    imports: [
        StoreModule.forFeature(statusFeature),
    ],
})
export class StatusStoreModule { }
