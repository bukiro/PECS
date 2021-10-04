export class OtherItem {
    public readonly _className: string = this.constructor.name;
    public name: string = "";
    public bulk: string = "";
    public readonly amount: number = 1;
    recast() {
        return this;
    }
}
