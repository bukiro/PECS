import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ObjectEffectsComponent } from './components/object-effects/object-effects.component';

@NgModule({
    imports: [
        CommonModule,
        BrowserModule,
        FormsModule,
        NgbPopoverModule,
    ],
    declarations: [
        ObjectEffectsComponent,
    ],
    exports: [
        ObjectEffectsComponent,
    ],
})
export class ObjectEffectsModule { }
