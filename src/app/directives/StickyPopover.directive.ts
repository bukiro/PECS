import {
    ElementRef, Directive, Input, TemplateRef, Renderer2, Injector, ViewContainerRef, NgZone, OnInit, Inject, ChangeDetectorRef, ApplicationRef, OnDestroy
} from '@angular/core';

import { DOCUMENT } from '@angular/common';
import { NgbPopover, NgbPopoverConfig } from '@ng-bootstrap/ng-bootstrap';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
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
    //CAUTION: To avoid a popover keeping itself open, never create a stickyPopover that contains a permanent element with the "popover-keepalive" class.
    // If absolutely necessary, use ignorePopoverKeepalive=true to ignore the keepalive and only respect open modals.

    @Input()
    private stickyPopover: TemplateRef<any>;
    @Input()
    private ignorePopoverKeepalive: boolean = false;

    ngpPopover: TemplateRef<any>;

    constructor(
        private refreshService: RefreshService,
        _elRef: ElementRef,
        _render: Renderer2,
        injector: Injector,
        viewContainerRef: ViewContainerRef,
        config: NgbPopoverConfig,
        ngZone: NgZone,
        changeRef: ChangeDetectorRef,
        applicationRef: ApplicationRef,
        @Inject(DOCUMENT) _document: any) {
        super(_elRef, _render, injector, viewContainerRef, config, ngZone, _document, changeRef, applicationRef);
    }

    private finish_Loading(): void {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe((target) => {
                if (target == "close-popovers") {
                    super.close()
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe((view) => {
                if (view.target == "close-popovers") {
                    super.close()
                }
            });
    }

    public ngOnInit(): void {
        super.ngOnInit();
        this.ngbPopover = this.stickyPopover;
        this.finish_Loading()
    }

    public close(): void {
        //Only close if no modal is open or popover-keepalive element exists.
        if (document.getElementsByTagName("ngb-modal-window").length || (!this.ignorePopoverKeepalive && document.getElementsByClassName("popover-keepalive").length)) {
        } else {
            super.close();
        }
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.unsubscribe();
        super.ngOnDestroy();
    }

    private unsubscribe(): void {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}