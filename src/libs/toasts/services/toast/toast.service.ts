import { Injectable } from '@angular/core';
import { Toast } from '../../definitions/interfaces/toast';

@Injectable({ providedIn: 'root' })
export class ToastService {
    public toasts: Array<Toast> = [];

    public show(text: string): void {
        this.toasts.push({ text });
    }

    public remove(toast: Toast): void {
        this.toasts = this.toasts.filter(t => t !== toast);
    }
}
