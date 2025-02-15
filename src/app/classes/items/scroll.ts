import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { MaybeSerialized, MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { Consumable } from './consumable';
import { computed, Signal } from '@angular/core';

export class Scroll extends Consumable implements MessageSerializable<Scroll> {
    //Scrolls should be type "scrolls" to be found in the database
    public readonly type: ItemTypes = 'scrolls';

    public static from(values: MaybeSerialized<Scroll>, recastFns: RecastFns): Scroll {
        return new Scroll().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Scroll>, recastFns: RecastFns): Scroll {
        super.with(values, recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): Scroll {
        return Scroll.from(this, recastFns);
    }

    public isEqual(compared: Partial<Scroll>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options);
    }

    public isScroll(): this is Scroll { return true; }

    public effectiveName$$(): Signal<string> {
        return computed(() => {
            const displayName = this.displayName();

            if (displayName) {
                return displayName;
            }

            const storedSpellName = this.storedSpells()[0]?.spells()[0]?.name;

            if (storedSpellName) {
                return `${ this.name } of ${ storedSpellName }`;
            }

            return this.name;
        });
    }
}
