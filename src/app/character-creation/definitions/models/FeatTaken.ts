export class FeatTaken {
    public name = '';
    public source = '';
    public locked = false;
    public automatic = false;
    public sourceId = '';
    public countAsFeat = '';
    public isFeature(className: string): boolean {
        //A feat is usually a feature if its source is your class or a dedication.
        return (this.source === className) || (this.locked && this.source.includes(' Dedication'));
    }
    public recast(): FeatTaken {
        return this;
    }
}
