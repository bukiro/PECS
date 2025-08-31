import { Serialized, MaybeSerialized, MessageSerializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerialization } from 'src/libs/shared/serialization/util/utils/serialization';
import { computed } from '@angular/core';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { Equipment } from './equipment';
import { ItemGainOnOptions } from './item-gain-options';
import { ItemTypes } from './item-types';

const { assign, forExport, forMessage, isEqual } = setupSerialization<AdventuringGear>({
    primitives: [
        'equippable',
        'hands',
        'isArmoredSkirt',
        'stack',
        'usage',
    ],
});

export class AdventuringGear extends Equipment implements MessageSerializable<AdventuringGear> {
    //Adventuring Gear should be type "adventuringgear" to be found in the database
    public readonly type: ItemTypes = 'adventuringgear';
    //Adventuring Gear can usually not be equipped or invested, but with exceptions.
    public equippable = false;
    //How many hands need to be free to use this item?
    public hands: string | number = '';
    //Does this item count for the "Armored Skirt" functionality?
    public isArmoredSkirt = false;
    //Some Items get bought in stacks. Stack defines how many you buy at once,
    //and how many make up one instance of the items Bulk.
    public stack = 1;
    //How is this item used/worn/applied? Example: held in 1 hand
    public usage = '';

    public readonly canStack$$ = computed(() =>
        //Some AdventuringGear can stack, even though Equipment cannot. This is an expanded version of Item.canStack().
        !this.equippable
        && !this.canInvest$$()
        && !this.gainItems().some(gain => gain.on !== ItemGainOnOptions.Use)
        && !this.storedSpells().length
        && !this.activities.length
        && !this.gainActivities.length,
    );

    public static from(values: MaybeSerialized<AdventuringGear>, recastFns: RecastFns): AdventuringGear {
        return new AdventuringGear().with(values, recastFns);
    }

    public with(values: MaybeSerialized<AdventuringGear>, recastFns: RecastFns): this {
        super.with(values, recastFns);
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<AdventuringGear> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<AdventuringGear> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return AdventuringGear.from(this, recastFns) as this;
    }

    public isEqual(compared: Partial<AdventuringGear>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isAdventuringGear(): this is AdventuringGear { return true; }
}
