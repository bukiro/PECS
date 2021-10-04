export class FeatTaken {
    public name: string;
    public source: string;
    public locked: boolean;
    public automatic: boolean;
    public sourceId: string;
    public countAsFeat: string;
    recast() {
        return this;
    }
}
