import { Equipment } from 'src/app/classes/Equipment';
import { Item } from './Item';

export class AdventuringGear extends Equipment {
    //Adventuring Gear should be type "adventuringgear" to be found in the database
    public readonly type = 'adventuringgear';
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

    public recast(restoreFn: <T extends Item>(obj: T) => T): AdventuringGear {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: <T extends Item>(obj: T) => T): AdventuringGear {
        return Object.assign<AdventuringGear, AdventuringGear>(
            new AdventuringGear(), JSON.parse(JSON.stringify(this)),
        ).recast(restoreFn);
    }

    public canStack(): boolean {
        //Some AdventuringGear can stack. This is an expanded version of Item.can_Stack().
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
