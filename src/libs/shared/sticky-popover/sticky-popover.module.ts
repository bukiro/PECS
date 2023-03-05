import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StickyPopoverDirective } from './directives/sticky-popover/sticky-popover.directive';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    imports: [
        CommonModule,

        NgbPopoverModule,
    ],
    declarations: [
        StickyPopoverDirective,
    ],
    exports: [
        StickyPopoverDirective,
    ],
})
export class StickyPopoverModule { }
