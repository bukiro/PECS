export class OtherItem {
    public name = '';
    public bulk = '';
    public readonly amount: number = 1;

    public recast(): OtherItem {
        return this;
    }

    public clone(): OtherItem {
        return Object.assign<OtherItem, OtherItem>(
            new OtherItem(), JSON.parse(JSON.stringify(this)),
        ).recast();
    }
}
