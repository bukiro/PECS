import { Equipment } from 'src/app/classes/Equipment';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, forMessage } = setupSerialization<AdventuringGear>({
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

    public static from(values: DeepPartial<AdventuringGear>, recastFns: RecastFns): AdventuringGear {
        return new AdventuringGear().with(values, recastFns);
    }

    public with(values: DeepPartial<AdventuringGear>, recastFns: RecastFns): AdventuringGear {
        super.with(values, recastFns);
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<AdventuringGear> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<AdventuringGear> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): AdventuringGear {
        return AdventuringGear.from(this, recastFns);
    }

    public isAdventuringGear(): this is AdventuringGear { return true; }

    public canStack(): boolean {
        //Some AdventuringGear can stack. This is an expanded version of Item.canStack().
        return (
            !this.equippable &&
            !this.canInvest() &&
            !this.gainItems.filter(gain => gain.on !== 'use').length &&
            !this.storedSpells.length &&
            !this.activities.length &&
            !this.gainActivities.length
        );
    }
}
