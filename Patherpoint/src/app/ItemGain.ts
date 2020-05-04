export class ItemGain {
    public readonly _className: string = this.constructor.name;
    public amount: number = 1;
    public id: string = "";
    public name: string = "Fist";
    public on: "grant"|"equip"|"" = "grant";
    public type: string = "weapons";
}
