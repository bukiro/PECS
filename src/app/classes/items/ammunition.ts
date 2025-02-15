import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { ItemActivity } from '../activities/item-activity';
import { Consumable } from './consumable';
import { computed, Signal } from '@angular/core';

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

    public static from(values: MaybeSerialized<Ammunition>, recastFns: RecastFns): Ammunition {
        return new Ammunition().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Ammunition>, recastFns: RecastFns): Ammunition {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Ammunition> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<Ammunition> {
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

    public effectiveName$$(): Signal<string> {
        return computed(() => {
            if (this.displayName) {
                return this.displayName;
            }

            const firstSpellName = this.storedSpells()[0]?.spells()[0]?.name;

            if (firstSpellName) {
                return `${ this.name } of ${ firstSpellName }`;
            }

            return this.name;
        });
    }
}
