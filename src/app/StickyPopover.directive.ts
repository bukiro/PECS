import {
    ElementRef,
    Directive, Input, TemplateRef,
    Renderer2,
    Injector,
    ComponentFactoryResolver,
    ViewContainerRef,
    NgZone,
    OnInit,
    OnDestroy,
    Inject, ChangeDetectorRef, ApplicationRef
} from '@angular/core';

import { DOCUMENT } from '@angular/common';
import { NgbPopover, NgbPopoverConfig } from '@ng-bootstrap/ng-bootstrap';
@Directive({
    // tslint:disable-next-line:directive-selector
    selector: '[stickyPopover]',
    exportAs: 'stickyPopover'
})
export class StickyPopoverDirective extends NgbPopover implements OnInit, OnDestroy {
    //Most popovers in this app are configured to close when clicking outside them.
    //This causes an issue in spells, items and activities when you open a target selection modal from inside the popover, with the popover closing when you click the modal.
    //If the popover is closed when the modal finishes, the context for the modal is gone, and the spell/item/activity is not activated.
    //A stickyPopover cannot close while a modal is opened, thereby avoiding this issue.
    
    @Input() stickyPopover: TemplateRef<any>;

    ngpPopover: TemplateRef<any>;

    constructor(
        private _elRef: ElementRef,
        private _render: Renderer2,
        injector: Injector,
        componentFactoryResolver: ComponentFactoryResolver,
        private viewContainerRef: ViewContainerRef,
        config: NgbPopoverConfig,
        ngZone: NgZone,
        changeRef: ChangeDetectorRef,
        applicationRef: ApplicationRef,
        @Inject(DOCUMENT) _document: any) {
        super(_elRef, _render, injector, componentFactoryResolver, viewContainerRef, config, ngZone, _document, changeRef, applicationRef);
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.ngbPopover = this.stickyPopover;
    }

    close() {
        //Only close if no modal is open.
        if (!document.getElementsByTagName("ngb-modal-window").length) {
            super.close();
        }
    }

}