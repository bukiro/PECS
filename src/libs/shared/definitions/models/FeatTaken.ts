import { v4 as uuidv4 } from 'uuid';

export class FeatTaken {
    public name = '';
    public source = '';
    public locked = false;
    public automatic = false;
    public sourceId = '';
    public countAsFeat = '';
    public id = uuidv4();

    public recast(): FeatTaken {
        return this;
    }

    public clone(): FeatTaken {
        return Object.assign<FeatTaken, FeatTaken>(new FeatTaken(), JSON.parse(JSON.stringify(this))).recast();
    }

    public isFeature(className: string): boolean {
        //A feat is usually a feature if its source is your class or a dedication.
        return (this.source === className) || (this.locked && this.source.includes(' Dedication'));
    }
}
