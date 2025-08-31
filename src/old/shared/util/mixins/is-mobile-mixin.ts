import { Constructable } from '../../../../libs/shared/common/util/models/constructable';
import { DisplayService } from '../../../../libs/shared/app-status/domain/services/display.service';
import { BaseClass } from 'src/libs/shared/common/util/models/base-class';
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
