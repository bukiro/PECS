import {
    ElementRef,
    Directive,
    Input,
    TemplateRef,
    Renderer2,
    Injector,
    ViewContainerRef,
    NgZone,
    OnInit,
    Inject,
    ChangeDetectorRef,
    ApplicationRef,
    OnDestroy,
} from '@angular/core';

import { DOCUMENT } from '@angular/common';
import { NgbPopover, NgbPopoverConfig } from '@ng-bootstrap/ng-bootstrap';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';

@Directive({
    selector: '[stickyPopover]',
    exportAs: 'stickyPopover',
})
export class StickyPopoverDirective extends NgbPopover implements OnInit, OnDestroy {
    // Most popovers in this app are configured to close when clicking outside them.
    // This causes an issue in spells, items and activities when you open a target selection modal
    // from inside the popover, with the popover closing when you click the modal.
    // If the popover is closed when the modal finishes, the context for the modal is gone, and the spell/item/activity is not activated.
    // A stickyPopover cannot close while a modal is opened, thereby avoiding this issue.
    // Another issue is caused when a popover is opened within another popover.
    // A stickyPopover cannot close while an element with the class "popover-keepalive" exists.
    // CAUTION: To avoid a popover keeping itself open, never create a stickyPopover that
    // contains a permanent element with the "popover-keepalive" class.
    // If absolutely necessary, use ignorePopoverKeepalive=true to ignore the keepalive and only respect open modals.

    @Input()
    public stickyPopover: TemplateRef<unknown>;
    @Input()
    public ignorePopoverKeepalive = false;
    @Input()
    public ngpPopover: TemplateRef<unknown>;

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _refreshService: RefreshService,
        _elRef: ElementRef,
        _render: Renderer2,
        injector: Injector,
        viewContainerRef: ViewContainerRef,
        config: NgbPopoverConfig,
        ngZone: NgZone,
        changeRef: ChangeDetectorRef,
        applicationRef: ApplicationRef,
        @Inject(DOCUMENT) _document: unknown) {
        super(_elRef, _render, injector, viewContainerRef, config, ngZone, _document, changeRef, applicationRef);
    }

    public ngOnInit(): void {
        super.ngOnInit();
        this.ngbPopover = this.stickyPopover;
        this._finishLoading();
    }

    public close(): void {
        if (
            document.getElementsByTagName('ngb-modal-window').length ||
            (!this.ignorePopoverKeepalive && document.getElementsByClassName('popover-keepalive').length)
        ) {
            //Only close if no modal is open or popover-keepalive element exists.
            return;
        } else {
            super.close();
        }
    }

    public ngOnDestroy(): void {
        if (!super.isOpen()) {
            this._unsubscribe();
        }

        super.ngOnDestroy();
    }

    private _finishLoading(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (target === 'close-popovers' && super.isOpen()) {
                    super.close();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.target === 'close-popovers' && super.isOpen()) {
                    super.close();
                }
            });
    }

    private _unsubscribe(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

}
