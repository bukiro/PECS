import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { CharacterService } from 'src/app/services/character.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { ToastService } from 'src/app/services/toast.service';

interface Toast {
    text: string;
    onClickCreature?: string;
    onClickAction?: string;
}

@Component({
    selector: 'app-toast-container',
    templateUrl: './toast-container.component.html',
    host: { '[class.ngb-toasts]': 'true' },
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        private readonly characterService: CharacterService,
        private readonly refreshService: RefreshService,
        public toastService: ToastService,
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    on_Click(toast: Toast) {
        if (toast.onClickAction) {
            this.refreshService.prepareDetailToChange(toast.onClickCreature || 'Character', toast.onClickAction);
            this.refreshService.processPreparedChanges();
        }

        this.toastService.remove(toast);
    }

    finish_Loading() {
        if (this.characterService.stillLoading) {
            setTimeout(() => this.finish_Loading(), 500);
        } else {
            this.changeSubscription = this.refreshService.componentChanged$
                .subscribe(target => {
                    if (['toasts', 'all'].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.detailChanged$
                .subscribe(view => {
                    if (['toasts', 'all'].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });

            return true;
        }
    }

    public ngOnInit(): void {
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
