import { Injectable, TemplateRef } from '@angular/core';
import { CharacterService } from './character.service';

@Injectable({ providedIn: 'root' })
export class ToastService {
    toasts: any[] = [];

    constructor(
    ) { }

    show(textOrTpl: string | TemplateRef<any>, options: any = {}, characterService: CharacterService) {
        this.toasts.push({ textOrTpl, ...options });
        characterService.set_Changed("toasts");
    }

    remove(toast) {
        this.toasts = this.toasts.filter(t => t !== toast);
    }
}