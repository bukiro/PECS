import { Injectable, TemplateRef } from '@angular/core';
import { RefreshService } from 'src/app/services/refresh.service';

interface Toast {
    textOrTpl: string | TemplateRef<unknown>;
    onClickCreature?: string;
    onClickAction?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    toasts: Toast[] = [];

    constructor(
        private refreshService: RefreshService
    ) { }

    show(textOrTpl: string | TemplateRef<unknown>, options: { onClickCreature?: string, onClickAction?: string } = {}) {
        options = Object.assign({
            onClickCreature: '',
            onClickAction: ''
        }, options);
        this.toasts.push({ textOrTpl, ...options });
        this.refreshService.set_Changed('toasts');
    }

    remove(toast) {
        this.toasts = this.toasts.filter(t => t !== toast);
    }
}
