import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

@NgModule({
    imports: [
        CommonModule,

        NgbToastModule,
    ],
    declarations: [
        ToastContainerComponent,
    ],
    exports: [
        ToastContainerComponent,
    ],
})
export class ToastsModule { }
