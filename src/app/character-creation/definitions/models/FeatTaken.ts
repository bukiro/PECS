export class FeatTaken {
    public name = '';
    public source = '';
    public locked = false;
    public automatic = false;
    public sourceId = '';
    public countAsFeat = '';
    public recast(): FeatTaken {
        return this;
    }
}
