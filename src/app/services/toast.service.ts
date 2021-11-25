import { Injectable, TemplateRef } from '@angular/core';
import { RefreshService } from 'src/app/services/refresh.service';

@Injectable({ providedIn: 'root' })
export class ToastService {
    toasts: any[] = [];

    constructor(
        private refreshService: RefreshService
    ) { }

    show(textOrTpl: string | TemplateRef<any>, options: { onClickCreature?: string, onClickAction?: string } = {}) {
        options = Object.assign({
            onClickCreature: "",
            onClickAction: ""
        }, options)
        this.toasts.push({ textOrTpl, ...options });
        this.refreshService.set_Changed("toasts");
    }

    remove(toast) {
        this.toasts = this.toasts.filter(t => t !== toast);
    }
}