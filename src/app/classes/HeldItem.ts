import { Equipment } from 'src/app/classes/Equipment';
import { Item } from 'src/app/classes/Item';

export class HeldItem extends Equipment {
    // Worn Items cannot be equipped or unequipped
    public readonly equippable = false;
    // Held Items should be type "helditems" to be found in the database
    public readonly type = 'helditems';
    /** How is this item held when used? Example: "held in one hand" */
    public usage = '';

    public recast(restoreFn: <T extends Item>(obj: T) => T): HeldItem {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: <T extends Item>(obj: T) => T): HeldItem {
        return Object.assign<HeldItem, HeldItem>(new HeldItem(), JSON.parse(JSON.stringify(this))).recast(restoreFn);
    }
}
