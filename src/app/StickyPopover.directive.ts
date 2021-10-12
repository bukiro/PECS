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
import { CharacterService } from './character.service';
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
    //Another issue is caused when a popover is opened within another popover.
    //A stickyPopover cannot close while an element with the class "popover-keepalive" exists.
    //CAUTION: To avoid a popover keeping itself open, never create a stickyPopover that contains an element with the "popover-keepalive" class.
    // If absolutely necessary, use ignorePopoverKeepalive=true to ignore the keepalive and only respect open modals.

    @Input()
    stickyPopover: TemplateRef<any>;
    @Input()
    ignorePopoverKeepalive: boolean = false;

    ngpPopover: TemplateRef<any>;


    constructor(
        private characterService: CharacterService,
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

    finish_Loading() {
        this.characterService.get_Changed()
            .subscribe((target) => {
                if (target == "close-popovers") {
                    super.close()
                }
            });
        this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.target == "close-popovers") {
                    super.close()
                }
            });
    }

    ngOnInit(): void {
        super.ngOnInit();
        this.ngbPopover = this.stickyPopover;
        this.finish_Loading()
    }

    close() {
        //Only close if no modal is open or popover-keepalive element exists.
        if (document.getElementsByTagName("ngb-modal-window").length || (!this.ignorePopoverKeepalive && document.getElementsByClassName("popover-keepalive").length)) {
        } else {
            super.close();
        }
    }

}