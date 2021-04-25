import { ChangeDetectionStrategy, ChangeDetectorRef, Component, TemplateRef } from '@angular/core';
import { CharacterService } from '../character.service';
import { ToastService } from '../toast.service';

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
        public toastService: ToastService
    ) { }

    isTemplate(toast) { return toast.textOrTpl instanceof TemplateRef; }

    finish_Loading() {
        if (this.characterService.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (["toasts", "all"].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
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

}