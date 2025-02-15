import { Constructable } from '../../definitions/interfaces/constructable';
import { DisplayService } from '../../services/display/display.service';
import { BaseClass } from '../classes/base-class';
import { Signal } from '@angular/core';

interface IsMobile {
    isMobile$$: Signal<boolean>;
    isMobile: boolean;
}

export function IsMobileMixin<T extends Constructable<BaseClass>>(base: T): Constructable<IsMobile> & T {
    return class extends base {
        public isMobile$$: Signal<boolean> = DisplayService.isMobile$$;

        public get isMobile(): boolean {
            return DisplayService.isMobile;
        }
    };
}
