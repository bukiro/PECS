import { Injectable, Signal, signal } from '@angular/core';
import { Toast } from '../../util/models/toast';

@Injectable({ providedIn: 'root' })
export class ToastService {
    public readonly toasts: Signal<Array<Toast>>;
    private readonly _toasts = signal<Array<Toast>>([]);

    constructor() {
        this.toasts = this._toasts.asReadonly();
    }

    public show(toast: Toast): void {
        this._toasts.update(value => [...value, toast]);
    }

    public remove(toast: Toast): void {
        this._toasts.update(value => value.filter(t => t !== toast));
    }
}
