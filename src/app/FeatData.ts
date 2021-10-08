export class FeatData {
    constructor(public level: number, public featName: string, public sourceId: string) { };
    public data: {} = {};
    recast() {
        return this;
    }
}
