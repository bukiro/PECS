import { Equipment } from 'src/app/classes/Equipment';
import { ItemRestoreFn } from 'src/libs/shared/definitions/Types/itemRestoreFn';

export class HeldItem extends Equipment {
    // Worn Items cannot be equipped or unequipped
    public readonly equippable = false;
    // Held Items should be type "helditems" to be found in the database
    public readonly type = 'helditems';
    /** How is this item held when used? Example: "held in one hand" */
    public usage = '';

    public recast(restoreFn: ItemRestoreFn): HeldItem {
        super.recast(restoreFn);

        return this;
    }

    public clone(restoreFn: ItemRestoreFn): HeldItem {
        return Object.assign<HeldItem, HeldItem>(new HeldItem(), JSON.parse(JSON.stringify(this))).recast(restoreFn);
    }
}
