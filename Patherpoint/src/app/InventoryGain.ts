export class InventoryGain {
    public readonly _className: string = this.constructor.name;
    //You cannot add any items to an inventory that would break its bulk limit.
    public bulkLimit: number = 0;
    //This is the amount of bulk that can be ignored when weighing this inventory.
    public bulkReduction: number = 0;
}