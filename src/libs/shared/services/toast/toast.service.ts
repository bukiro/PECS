import { Injectable } from '@angular/core';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

export interface Toast {
    text: string;
    onClickCreature?: CreatureTypes;
    onClickAction?: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    public toasts: Array<Toast> = [];

    constructor(
        private readonly _refreshService: RefreshService,
    ) { }

    public show(text: string, options: { onClickCreature?: CreatureTypes; onClickAction?: string } = {}): void {
        this.toasts.push({ text, ...options });
        this._refreshService.setComponentChanged('toasts');
    }

    public remove(toast: Toast): void {
        this.toasts = this.toasts.filter(t => t !== toast);
    }
}
