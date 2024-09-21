import {
    Directive,
    Input,
    TemplateRef,
    OnInit,
    OnDestroy,
} from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Directive({
    selector: '[stickyPopover]',
    exportAs: 'stickyPopover',
    standalone: true,
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
    public stickyPopover!: TemplateRef<unknown>;
    @Input()
    public ignorePopoverKeepalive = false;

    constructor(
        refreshService: RefreshService,
    ) {
        super();

        refreshService.closePopovers$
            .pipe(
                takeUntilDestroyed(),
            ).subscribe(() => {
                if (super.isOpen()) {
                    super.close();
                }
            });
    }

    public ngOnInit(): void {
        super.ngOnInit();
        this.ngbPopover = this.stickyPopover;
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

}
