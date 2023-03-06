import { Observable } from 'rxjs';
import { Constructable } from '../../definitions/interfaces/constructable';
import { DisplayService } from '../../services/display/display.service';
import { BaseClass } from './base-class';

interface IsMobile {
    isMobile$: Observable<boolean>;
    isMobile: boolean;
}

export function IsMobileMixin<T extends Constructable<BaseClass>>(base: T): Constructable<IsMobile> & T {
    return class extends base {
        public isMobile$: Observable<boolean> = DisplayService.isMobile$;

        public get isMobile(): boolean {
            return DisplayService.isMobile;
        }
    };
}
