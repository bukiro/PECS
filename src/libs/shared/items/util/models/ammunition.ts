import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/serialization/util/models/serializable';
import { ItemTypes } from './item-types';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { Consumable } from './consumable';
import { computed } from '@angular/core';
import { ItemActivity } from 'src/libs/shared/activities/util/models/item-activity';

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

    public effectiveName$$ = computed(() => {
        const displayName = this.displayName();

        if (displayName) {
            return displayName;
        }

        const firstSpellName = this.storedSpells()[0]?.spells()[0]?.name;

        if (firstSpellName) {
            return `${ this.name } of ${ firstSpellName }`;
        }

        return this.name;
    });

    public static from(values: MaybeSerialized<Ammunition>, recastFns: RecastFns): Ammunition {
        return new Ammunition().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Ammunition>, recastFns: RecastFns): this {
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

    public clone(recastFns: RecastFns): this {
        return Ammunition.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<Ammunition>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isAmmunition(): this is Ammunition { return true; }
}
