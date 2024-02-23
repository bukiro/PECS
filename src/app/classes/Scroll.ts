import { Observable, of } from 'rxjs';
import { Consumable } from 'src/app/classes/Consumable';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';

export class Scroll extends Consumable implements MessageSerializable<Scroll> {
    //Scrolls should be type "scrolls" to be found in the database
    public readonly type: ItemTypes = 'scrolls';

    public static from(values: DeepPartial<Scroll>, recastFns: RecastFns): Scroll {
        return new Scroll().with(values, recastFns);
    }

    public with(values: DeepPartial<Scroll>, recastFns: RecastFns): Scroll {
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

    public effectiveName$(): Observable<string> {
        return of(this.effectiveNameSnapshot());
    }

    public effectiveNameSnapshot(): string {
        if (this.displayName) {
            return this.displayName;
        } else if (this.storedSpells.length && this.storedSpells[0].spells.length) {
            return `${ this.name } of ${ this.storedSpells[0].spells[0].name }`;
        } else {
            return this.name;
        }
    }
}
