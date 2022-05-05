import { Injectable } from '@angular/core';
import { RefreshService } from 'src/app/services/refresh.service';

interface Toast {
    text: string;
    onClickCreature?: string;
    onClickAction?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    public toasts: Array<Toast> = [];

    constructor(
        private readonly _refreshService: RefreshService,
    ) { }

    public show(text: string, options: { onClickCreature?: string; onClickAction?: string } = {}): void {
        options = { onClickCreature: '',
            onClickAction: '', ...options };
        this.toasts.push({ text, ...options });
        this._refreshService.set_Changed('toasts');
    }

    public remove(toast: Toast): void {
        this.toasts = this.toasts.filter(t => t !== toast);
    }
}
