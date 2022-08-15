export class InventoryGain {
    /** You cannot add any items to an inventory that would break its bulk limit. */
    public bulkLimit = 0;
    /** This is the amount of bulk that can be ignored when weighing this inventory. */
    public bulkReduction = 0;

    public recast(): InventoryGain {
        return this;
    }

    public clone(): InventoryGain {
        return Object.assign<InventoryGain, InventoryGain>(new InventoryGain(), JSON.parse(JSON.stringify(this))).recast();
    }
}
