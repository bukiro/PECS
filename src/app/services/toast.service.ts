import { Injectable } from '@angular/core';
import { RefreshService } from 'src/app/services/refresh.service';

interface Toast {
    text: string;
    onClickCreature?: string;
    onClickAction?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    toasts: Toast[] = [];

    constructor(
        private refreshService: RefreshService
    ) { }

    show(text: string, options: { onClickCreature?: string, onClickAction?: string } = {}) {
        options = Object.assign({
            onClickCreature: '',
            onClickAction: ''
        }, options);
        this.toasts.push({ text, ...options });
        this.refreshService.set_Changed('toasts');
    }

    remove(toast: Toast) {
        this.toasts = this.toasts.filter(t => t !== toast);
    }
}
