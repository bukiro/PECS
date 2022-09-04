import { Equipment } from 'src/app/classes/Equipment';
import { RecastFns } from 'src/libs/shared/definitions/Interfaces/recastFns';

export class HeldItem extends Equipment {
    // Worn Items cannot be equipped or unequipped
    public readonly equippable = false;
    // Held Items should be type "helditems" to be found in the database
    public readonly type = 'helditems';
    /** How is this item held when used? Example: "held in one hand" */
    public usage = '';

    public recast(recastFns: RecastFns): HeldItem {
        super.recast(recastFns);

        return this;
    }

    public clone(recastFns: RecastFns): HeldItem {
        return Object.assign<HeldItem, HeldItem>(new HeldItem(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }
}
