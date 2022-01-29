import { ChangeDetectionStrategy, ChangeDetectorRef, Component, TemplateRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { CharacterService } from 'src/app/services/character.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
    selector: 'app-toast-container',
    templateUrl: './toast-container.component.html',
    host: { '[class.ngb-toasts]': 'true' },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastContainerComponent {

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private refreshService: RefreshService,
        public toastService: ToastService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    isTemplate(toast) { return toast.textOrTpl instanceof TemplateRef; }

    on_Click(toast) {
        if (toast.onClickAction) {
            this.refreshService.set_ToChange(toast.onClickCreature || "Character", toast.onClickAction);
            this.refreshService.process_ToChange();
        }
        this.toastService.remove(toast);
    }

    finish_Loading() {
        if (this.characterService.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (["toasts", "all"].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (["toasts", "all"].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}