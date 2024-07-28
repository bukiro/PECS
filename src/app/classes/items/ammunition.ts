import { Observable, of } from 'rxjs';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { ItemActivity } from '../activities/item-activity';
import { Consumable } from './consumable';

const { assign, forExport, forMessage, isEqual } = setupSerializationWithHelpers<Ammunition>({
    primitives: [
        'actions',
        'ammunition',
    ],
    serializableArrays: {
        activities:
            recastFns => obj => ItemActivity.from(obj, recastFns),
    },
});

export class Ammunition extends Consumable implements MessageSerializable<Ammunition> {
    //Ammunition should be type "ammunition" to be found in the database
    public readonly type: ItemTypes = 'ammunition';
    public actions = '';
    /**
     * The ammunition group, in order to identify suitable weapons.
     * Same as the weapon type: Arrows, Blowgun Darts, Bolts, Sling Bullets or Any
     */
    public ammunition = '';

    public activities: Array<ItemActivity> = [];

    public static from(values: DeepPartial<Ammunition>, recastFns: RecastFns): Ammunition {
        return new Ammunition().with(values, recastFns);
    }

    public with(values: DeepPartial<Ammunition>, recastFns: RecastFns): Ammunition {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<Ammunition> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<Ammunition> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): Ammunition {
        return Ammunition.from(this, recastFns);
    }

    public isEqual(compared: Partial<Ammunition>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isAmmunition(): this is Ammunition { return true; }

    public effectiveName$(): Observable<string> {
        return of(this.effectiveNameSnapshot());
    }

    public effectiveNameSnapshot(): string {
        if (this.displayName) {
            return this.displayName;
        } else if (this.storedSpells[0]?.spells[0]) {
            return `${ this.name } of ${ this.storedSpells[0].spells[0].name }`;
        } else {
            return this.name;
        }
    }
}
