import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { DescriptionModule } from '../ui/description/description.module';
import { ConditionContentComponent } from './components/condition-content/condition-content.component';

@NgModule({
    imports: [
        CommonModule,

        NgbCollapseModule,

        DescriptionModule,
    ],
    declarations: [
        ConditionContentComponent,
    ],
    exports: [
        ConditionContentComponent,
    ],
})
export class ConditionContentModule { }
