export class OtherItem {
    public name = '';
    public bulk = '';
    public readonly amount: number = 1;
    public recast(): OtherItem {
        return this;
    }
}
