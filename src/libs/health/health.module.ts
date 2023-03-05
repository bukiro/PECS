import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthComponent } from './components/health/health.component';
import { TagsModule } from '../shared/tags/tags.module';
import { NgbPopoverModule, NgbProgressbarModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltipModule,
        NgbPopoverModule,
        NgbProgressbarModule,

        TagsModule,
    ],
    declarations: [
        HealthComponent,
    ],
    exports: [
        HealthComponent,
    ],
})
export class HealthModule { }
